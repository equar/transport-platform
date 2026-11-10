import { documentContentType } from './documentContentType';
it('preserves document formats when Android providers omit MIME metadata', () => {
  expect(documentContentType('license.JPG')).toBe('image/jpeg');
  expect(documentContentType('background.jpeg', 'application/octet-stream')).toBe('image/jpeg');
  expect(documentContentType('certificate.png')).toBe('image/png');
  expect(documentContentType('document.pdf')).toBe('application/pdf');
  expect(documentContentType('scan', 'image/png')).toBe('image/png');
  expect(documentContentType('unknown')).toBe('application/octet-stream');
});
