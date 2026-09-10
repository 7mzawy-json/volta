// Password length rules, in one place because two routes set passwords and they
// have to agree.
//
// Deliberately short: a length floor and nothing else. Composition rules ("one
// symbol, one capital") push people toward Passw0rd! and NIST no longer
// recommends them. Length is what actually helps.
export const MIN_PASSWORD = 8;

// bcrypt hashes at most 72 BYTES and silently ignores everything past them.
//
// The limit used to be 200 *characters*, with a comment claiming it existed to
// stop bcrypt truncating — which it did not do. Two different accepted
// passwords that share their first 72 bytes hash identically, so somebody could
// change the tail of a long password and still sign in with the old one. An
// audit demonstrated exactly that: signing up with 'a'×72 + 'one' and then
// logging in with 'a'×72 + 'TWO' succeeded.
//
// Bytes, not characters, because that is what bcrypt counts: Arabic is two
// bytes per letter in UTF-8, so an Arabic passphrase reaches the limit in half
// as many characters as an English one.
export const MAX_PASSWORD_BYTES = 72;

const encoder = new TextEncoder();

export function passwordBytes(plain) {
  return encoder.encode(plain).length;
}

// Returns a stable error code, or null when the password is acceptable to set.
export function passwordProblem(plain) {
  if (plain.length < MIN_PASSWORD) return 'passwordTooShort';
  if (passwordBytes(plain) > MAX_PASSWORD_BYTES) return 'passwordTooLong';
  return null;
}
