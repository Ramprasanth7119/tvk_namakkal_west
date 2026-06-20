export function validateComplaintInput(
  voterVerified: boolean,
  name: string,
  mobile: string,
  address: string,
  category: string,
  description: string
): string | null {
  if (!voterVerified) {
    return "வாக்காளர் அடையாளம் சரிபார்க்கப்பட வேண்டும்.";
  }
  if (!name.trim()) {
    return "குடிமகன் பெயர் தேவை.";
  }
  const cleanMobile = mobile.replace(/\D/g, "");
  if (!cleanMobile || cleanMobile.length !== 10) {
    return "சரியான 10 இலக்க அலைபேசி எண் தேவை.";
  }
  if (!address.trim()) {
    return "முகவரி தேவை.";
  }
  if (!category) {
    return "துறை தேர்ந்தெடுக்கப்பட வேண்டும்.";
  }
  if (!description.trim()) {
    return "குறை விளக்கம் தேவை.";
  }
  return null;
}
