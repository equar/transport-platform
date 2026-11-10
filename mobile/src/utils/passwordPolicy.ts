// Matches the current backend password encoder capacity, including multibyte characters.
export function passwordValidationError(password: string): string | null {
  if (password.length < 8) return 'Use at least 8 characters.';
  let bytes = 0;
  for (const character of password) {
    const code = character.codePointAt(0)!;
    bytes += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4;
  }
  return password.length > 100 || bytes > 72 ? 'This password is too long. Try a shorter one.' : null;
}
