package com.transportplatform.tms.features.auth.application;

import com.transportplatform.tms.common.exception.*;
import com.transportplatform.tms.common.security.*;
import com.transportplatform.tms.features.auth.domain.*;
import com.transportplatform.tms.features.audit.application.*;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.Clock;
import java.util.*;
import javax.crypto.*;
import javax.crypto.spec.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** RFC 6238, individual 160-bit keys, encrypted at rest and atomic replay protection. */
@Service
public class MfaService {
    private final AppUserRepository users;
    private final CurrentAuthenticatedUserService current;
    private final PasswordEncoder passwords;
    private final AuthSessionService sessions;
    private final AuditLogService audit;
    private final AuthFlowProperties policy;
    private final Clock clock;
    private final byte[] key;
    private final SecureRandom random = new SecureRandom();
    public MfaService(AppUserRepository users, CurrentAuthenticatedUserService current, PasswordEncoder passwords,
            AuthSessionService sessions, AuditLogService audit, AuthFlowProperties policy, Clock clock,
            @Value("${app.security.mfa-encryption-key:}") String encryptionKey) {
        this.users=users; this.current=current; this.passwords=passwords; this.sessions=sessions;
        this.audit=audit; this.policy=policy; this.clock=clock;
        try { key=encryptionKey.isBlank() ? null : Base64.getDecoder().decode(encryptionKey); }
        catch(IllegalArgumentException e) { throw new IllegalStateException("MFA encryption key must be base64-encoded 32 bytes."); }
        if(key!=null && key.length!=32) throw new IllegalStateException("MFA encryption key must be 32 bytes.");
    }
    public record Status(boolean enabled, boolean available, boolean required) {}
    public record Setup(String secret, String account, java.time.Instant expiresAt) {}
    public record Recovery(List<String> recoveryCodes) {}
    @Transactional(readOnly=true) public Status status() {
        var user=users.findById(current.requireCurrentUser().id()).orElseThrow(this::invalid);
        return new Status(user.getMfaSecret()!=null,key!=null,required(user));
    }
    public boolean required(AppUser user) { return policy.isRequireMfaForPrivilegedAccounts() &&
        (user.getRoles().contains(RoleName.ROLE_PLATFORM_ADMIN) || user.getRoles().contains(RoleName.ROLE_TENANT_ADMIN)); }
    private AppUser authenticated(String password) {
        var identity=current.requireCurrentUser();
        var user=users.findByEmailIgnoreCase(identity.getUsername()).orElseThrow(this::invalid);
        if(!user.isActiveForLogin() || !PasswordEncoding.matches(passwords,password,user.getPasswordHash())) throw invalid();
        return user;
    }
    @Transactional public Setup setup(String password) {
        requireKey(); var user=authenticated(password);
        if(user.getMfaSecret()!=null) throw new ApiException(ErrorCode.RESOURCE_CONFLICT,HttpStatus.CONFLICT,"An authenticator is already enabled.");
        byte[] secret=new byte[20];random.nextBytes(secret);
        user.setMfaPendingSecret(encrypt(secret,user.getId()));
        user.setMfaPendingExpiresAt(clock.instant().plusSeconds(300));
        users.save(user);
        return new Setup(base32(secret),user.getEmail(),user.getMfaPendingExpiresAt());
    }
    @Transactional public Recovery activate(String password,String code) {
        var user=authenticated(password);
        if(user.getMfaSecret()!=null || user.getMfaPendingSecret()==null || user.getMfaPendingExpiresAt()==null || !user.getMfaPendingExpiresAt().isAfter(clock.instant())) throw invalid();
        long step=matchingCounter(decrypt(user.getMfaPendingSecret(),user.getId()),code);
        if(step<0) throw invalid();
        user.setMfaSecret(user.getMfaPendingSecret());user.setMfaPendingSecret(null);user.setMfaPendingExpiresAt(null);user.setMfaLastCounter(step);
        List<String> recovery=new ArrayList<>();List<String> hashes=new ArrayList<>();
        for(int i=0;i<8;i++) { byte[] bytes=new byte[16];random.nextBytes(bytes);String value=HexFormat.of().formatHex(bytes); recovery.add(value);hashes.add(hash(value)); }
        user.setMfaRecoveryHashes(String.join(",",hashes)); users.saveAndFlush(user);
        record(user,"MFA_ENABLED");sessions.revokeAllForUser(user.getId());
        return new Recovery(List.copyOf(recovery));
    }
    @Transactional public void disable(String password,String code) {
        var user=authenticated(password);
        if(required(user)) throw new ApiException(ErrorCode.FORBIDDEN,HttpStatus.FORBIDDEN,"Your administrator requires an authenticator. Use a recovery code to sign in if needed.");
        verify(user,code);
        user.setMfaSecret(null);user.setMfaRecoveryHashes(null);user.setMfaPendingSecret(null);user.setMfaPendingExpiresAt(null);user.setMfaLastCounter(-1);
        users.saveAndFlush(user); record(user,"MFA_DISABLED"); sessions.revokeAllForUser(user.getId());
    }
    @Transactional public void verify(AppUser user,String code) {
        if(user.getMfaSecret()==null) {
            if(required(user)) throw new ApiException(ErrorCode.FORBIDDEN,HttpStatus.UNAUTHORIZED,"Authenticator enrollment is required. Contact your administrator.");
            return;
        }
        if(code==null) throw invalid();
        if(code.matches("[0-9a-fA-F]{32}") && user.getMfaRecoveryHashes()!=null) {
            String previous=user.getMfaRecoveryHashes();var remaining=new ArrayList<>(Arrays.asList(previous.split(",")));
            String candidate=hash(code.toLowerCase(Locale.ROOT));
            if(remaining.remove(candidate) && users.consumeMfaRecovery(user.getId(),user.getMfaSecret(),previous,String.join(",",remaining))==1) {
                record(user,"MFA_RECOVERY_USED"); return;
            }
            throw invalid();
        }
        long step=matchingCounter(decrypt(user.getMfaSecret(),user.getId()),code);
        if(step<0 || users.consumeMfaCounter(user.getId(),user.getMfaSecret(),step)!=1) throw invalid();
    }
    private long matchingCounter(byte[] secret,String code) {
        if(code==null || !code.matches("[0-9]{6}")) return -1;
        long step=clock.instant().getEpochSecond()/30;
        for(long candidate=step-1;candidate<=step+1;candidate++) if(MessageDigest.isEqual(totp(secret,candidate).getBytes(StandardCharsets.US_ASCII),code.getBytes(StandardCharsets.US_ASCII))) return candidate;
        return -1;
    }
    static String totp(byte[] secret,long step) {
        try { Mac mac=Mac.getInstance("HmacSHA1");mac.init(new SecretKeySpec(secret,"HmacSHA1"));byte[] digest=mac.doFinal(ByteBuffer.allocate(8).putLong(step).array());int offset=digest[digest.length-1]&15;
            int value=((digest[offset]&127)<<24)|((digest[offset+1]&255)<<16)|((digest[offset+2]&255)<<8)|(digest[offset+3]&255);
            return String.format(Locale.ROOT,"%06d",value%1000000);
        } catch(GeneralSecurityException e) { throw new IllegalStateException("Authenticator verification unavailable."); }
    }
    private void requireKey() { if(key==null) throw new ApiException(ErrorCode.INTERNAL_SERVER_ERROR,HttpStatus.SERVICE_UNAVAILABLE,"Authenticator enrollment is not configured. Contact support."); }
    private String encrypt(byte[] secret,Long user) {
        requireKey();try { byte[] iv=new byte[12];random.nextBytes(iv);Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.ENCRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,iv));cipher.updateAAD(user.toString().getBytes(StandardCharsets.UTF_8));byte[] encrypted=cipher.doFinal(secret);
            return Base64.getEncoder().encodeToString(ByteBuffer.allocate(iv.length+encrypted.length).put(iv).put(encrypted).array());
        } catch(GeneralSecurityException e) { throw new IllegalStateException("Authenticator encryption unavailable."); }
    }
    private byte[] decrypt(String value,Long user) {
        requireKey();try { byte[] bytes=Base64.getDecoder().decode(value);Cipher cipher=Cipher.getInstance("AES/GCM/NoPadding");cipher.init(Cipher.DECRYPT_MODE,new SecretKeySpec(key,"AES"),new GCMParameterSpec(128,Arrays.copyOf(bytes,12)));cipher.updateAAD(user.toString().getBytes(StandardCharsets.UTF_8));return cipher.doFinal(Arrays.copyOfRange(bytes,12,bytes.length)); }
        catch(GeneralSecurityException|IllegalArgumentException e) { throw new IllegalStateException("Authenticator configuration is unavailable."); }
    }
    private static String base32(byte[] bytes) {String alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";StringBuilder out=new StringBuilder();int buffer=0,bits=0;for(byte b:bytes){buffer=(buffer<<8)|(b&255);bits+=8;while(bits>=5){bits-=5;out.append(alphabet.charAt((buffer>>bits)&31));}}if(bits>0)out.append(alphabet.charAt((buffer<<(5-bits))&31));return out.toString();}
    private static String hash(String value) {try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));}catch(NoSuchAlgorithmException e){throw new IllegalStateException(e);}}
    private ApiException invalid() {return new ApiException(ErrorCode.INVALID_CREDENTIALS,HttpStatus.UNAUTHORIZED,"Enter a valid, unused authenticator or recovery code.");}
    private void record(AppUser user,String action) {audit.record(new AuditLogCommand(null,user.getTenantId(),"AUTH",action,"USER",user.getId().toString(),"Authenticator settings changed or recovery used.",null,Map.of("userId",user.getId())));}
}
