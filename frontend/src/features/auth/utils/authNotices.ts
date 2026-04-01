export type AuthNoticeReason = "session-expired" | "invalid-access";

export interface AuthNotice {
  reason: AuthNoticeReason;
  message: string;
}

const AUTH_NOTICE_STORAGE_KEY = "transport-platform.auth.notice";

export function persistAuthNotice(notice: AuthNotice) {
  window.sessionStorage.setItem(AUTH_NOTICE_STORAGE_KEY, JSON.stringify(notice));
}

export function consumeAuthNotice(): AuthNotice | null {
  const raw = window.sessionStorage.getItem(AUTH_NOTICE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  window.sessionStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);

  try {
    return JSON.parse(raw) as AuthNotice;
  } catch {
    return null;
  }
}
