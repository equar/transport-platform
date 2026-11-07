export function formatAddress(parts: {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
}): string {
  const { line1, line2, city, state, zipCode } = parts;
  return [line1, line2, city, state && zipCode ? `${state} ${zipCode}` : state ?? zipCode]
    .filter(Boolean)
    .join(', ');
}

export function formatFullName(
  firstName: string | null,
  lastName: string | null,
): string {
  return [firstName, lastName].filter(Boolean).join(' ') || 'Unknown';
}
