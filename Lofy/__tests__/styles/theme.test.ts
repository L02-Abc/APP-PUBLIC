import { headerTheme, tabBarTheme, loginTheme, statusColor } from '../../styles/theme';

describe('theme module', () => {
  it('has expected headerTheme structure', () => {
    expect(headerTheme.colors.primary).toMatch(/^#/);
    expect(headerTheme.spacing.medium).toBe(16);
    expect(headerTheme.typography.heading.fontWeight).toBe('bold');
  });

  it('tabBarTheme sets color tokens', () => {
    expect(tabBarTheme.colors.activeTintColor).toBeDefined();
    expect(tabBarTheme.colors.background).toBe('#FFFFFF');
  });

  it('loginTheme has primary and background', () => {
    expect(loginTheme.colors.primary).toMatch(/^#/);
    expect(loginTheme.colors.background).toBe('#FFFFFF');
  });

  it('statusColor maps text and background variants', () => {
    expect(Object.keys(statusColor.colorsText)).toEqual(
      expect.arrayContaining(['open', 'return', 'pending', 'withSecurity'])
    );
    expect(Object.keys(statusColor.colorsBackground)).toEqual(
      expect.arrayContaining(['open', 'return', 'pending', 'withSecurity'])
    );
  });
});
