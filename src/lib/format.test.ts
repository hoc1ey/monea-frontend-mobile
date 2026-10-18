import { formatDate, formatMoney, formatPeriod, roundMoney, sumMoney } from './format';

describe('formatMoney', () => {
  it('formats whole amounts with thousands separator and two decimals', () => {
    expect(formatMoney(1847)).toBe('$1,847.00');
    expect(formatMoney(1234567.891)).toBe('$1,234,567.89');
  });

  it('formats zero and small amounts', () => {
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(7.5)).toBe('$7.50');
  });

  it('keeps the sign for negative amounts', () => {
    expect(formatMoney(-7.5)).toBe('-$7.50');
    expect(formatMoney(-1234.5)).toBe('-$1,234.50');
  });
});

describe('roundMoney', () => {
  it('rounds to two decimals avoiding float drift', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(1.005)).toBe(1.01);
    expect(roundMoney(33.333)).toBe(33.33);
  });
});

describe('sumMoney', () => {
  it('sums and rounds each total, never accumulating floats', () => {
    expect(sumMoney([0.1, 0.2])).toBe(0.3);
    expect(sumMoney([100, 33.33, 33.33, 33.34])).toBe(200);
    expect(sumMoney([])).toBe(0);
  });
});

describe('formatPeriod', () => {
  it('renders a YYYY-MM period as month abbreviation and year', () => {
    expect(formatPeriod('2026-10')).toBe('Oct 2026');
    expect(formatPeriod('2027-01')).toBe('Ene 2027');
  });
});

describe('formatDate', () => {
  it('renders calendar dates with the short day+month pattern', () => {
    expect(formatDate(new Date(2026, 9, 16), 'd MMM')).toBe('16 oct');
  });

  it('renders the long detail pattern', () => {
    expect(formatDate(new Date(2026, 9, 16))).toBe('16 de octubre de 2026');
  });
});
