export function validateLoginInput(username?: string, password?: string): string | null {
  if (!username?.trim()) {
    return "பயனர் பெயர் தேவை (Username is required)";
  }
  if (!password) {
    return "நுழைவு கடவுச்சொல் தேவை (Password is required)";
  }
  if (password.length < 4) {
    return "கடவுச்சொல் குறைந்தது 4 எழுத்துக்கள் இருக்க வேண்டும்";
  }
  return null;
}
