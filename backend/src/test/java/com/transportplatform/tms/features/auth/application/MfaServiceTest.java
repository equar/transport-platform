package com.transportplatform.tms.features.auth.application;

import static org.junit.jupiter.api.Assertions.*;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class MfaServiceTest {
    @Test void matchesRfc6238Sha1VectorsWithSixDigitTruncation() {
        byte[] key="12345678901234567890".getBytes(StandardCharsets.US_ASCII);
        long[] seconds={59,1111111109L,1111111111L,1234567890L,2000000000L,20000000000L};
        String[] expected={"287082","081804","050471","005924","279037","353130"};
        for(int i=0;i<seconds.length;i++) assertEquals(expected[i],MfaService.totp(key,seconds[i]/30));
    }
}
