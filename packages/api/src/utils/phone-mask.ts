export function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 8) {
    return "****";
  }

  const prefix = phone.slice(0, 3);
  const lastFour = phone.slice(-4);
  const maskedLength = phone.length - 3 - 4;

  if (maskedLength <= 0) {
    return `${prefix}${lastFour}`;
  }

  return `${prefix}${"*".repeat(maskedLength)}${lastFour}`;
}
