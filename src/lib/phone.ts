export const normalizePhone = (value: string) => value.replace(/\D/g, '');

export const isValidPhone = (value: string) => {
  const normalized = normalizePhone(value);

  // Azerbaijan: +994 (9 digits after country code)
  if (normalized.startsWith('994') && normalized.length === 12) return true;

  // Turkey: +90 (10 digits after country code)
  if (normalized.startsWith('90') && normalized.length === 12) return true;

  // Russia: +7 (10 digits after country code)
  if (normalized.startsWith('7') && normalized.length === 11) return true;

  // General international: 9-15 digits
  if (normalized.length >= 9 && normalized.length <= 15) return true;

  return false;
};
