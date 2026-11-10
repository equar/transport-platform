// Some Android document providers omit a MIME type or return a generic binary type.
export function documentContentType(fileName: string, reportedType?: string | null): string {
  const reported = reportedType?.trim().toLowerCase();
  if (reported && reported !== 'application/octet-stream') return reported;
  if (/\.png$/i.test(fileName)) return 'image/png';
  if (/\.jpe?g$/i.test(fileName)) return 'image/jpeg';
  if (/\.pdf$/i.test(fileName)) return 'application/pdf';
  return 'application/octet-stream';
}
