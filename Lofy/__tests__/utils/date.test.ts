import { formatDateVN, formatTimeVN, parseIsoToDate } from '../../utils/date';

describe('utils/date', () => {
  it('formats date in vi-VN dd/mm/yyyy', () => {
    const d = new Date(Date.UTC(2026, 0, 3, 12, 34)); // 3 Jan 2026
    const s = formatDateVN(d);
    expect(typeof s).toBe('string');
    expect(s).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('formats time in vi-VN hh:mm', () => {
    const d = new Date(Date.UTC(2026, 0, 3, 12, 5));
    const s = formatTimeVN(d);
    expect(typeof s).toBe('string');
    expect(s).toMatch(/\d{2}:\d{2}/);
  });

  it('parses ISO string to Date', () => {
    const iso = '2026-01-03T12:34:00.000Z';
    const d = parseIsoToDate(iso);
    expect(d instanceof Date).toBe(true);
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(0);
    expect(d.getUTCDate()).toBe(3);
    expect(d.getUTCHours()).toBe(12);
    expect(d.getUTCMinutes()).toBe(34);
  });

  it('handles invalid ISO gracefully', () => {
    const d = parseIsoToDate('invalid');
    expect(d instanceof Date).toBe(true);
    expect(Number.isNaN(d.getTime())).toBe(true);
  });
});
