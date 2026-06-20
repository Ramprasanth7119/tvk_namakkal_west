export function validateVoterIdInput(voterId?: string): string | null {
  if (!voterId?.trim()) {
    return "வாக்காளர் அடையாள எண் தேவை (Voter ID is required)";
  }
  return null;
}

export function validateVoterFallbackInput(
  name?: string,
  doorNo?: string,
  dob?: string,
  ward?: string
): string | null {
  if (!name?.trim() || !doorNo?.trim() || !dob || !ward?.trim()) {
    return "பெயர், கதவு எண், பிறந்த தேதி மற்றும் வார்டு எண் அனைத்தும் தேவை.";
  }
  return null;
}
