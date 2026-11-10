import { brandingColors } from './branding';
import { Colors } from './tokens';
it('resolves tenant colors and derived soft tones without mutating shared defaults', () => {
  const first = brandingColors({ primaryColor: '#276442', secondaryColor: '#173c2b', accentColor: '#8b641c' });
  expect(first.primary).toBe('#276442'); expect(first.secondary).toBe('#173c2b');
  expect(first.primarySoft).not.toBe(Colors.primarySoft); expect(Colors.primary).toBe('#004787');
  expect(brandingColors(null).primary).toBe(Colors.primary);
});
it('rejects malformed legacy colors and does not carry another tenant palette forward', () => {
  brandingColors({ primaryColor: '#276442' });
  expect(brandingColors({ primaryColor: 'invalid' }).primary).toBe(Colors.primary);
  expect(brandingColors({ primaryColor: '#5341a1' }).primary).toBe('#5341a1');
});
