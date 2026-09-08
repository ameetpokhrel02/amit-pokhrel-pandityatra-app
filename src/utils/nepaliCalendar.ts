import NepaliDate from 'nepali-date-converter';

export const NEPALI_MONTHS = [
  'बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज',
  'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत',
];

export const NEPALI_WEEKDAYS = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि'];

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

export const toDevanagariDigits = (value: number | string): string =>
  String(value).replace(/[0-9]/g, (d) => DEVANAGARI_DIGITS[Number(d)]);

export interface BsDate {
  year: number;
  month: number; // 0-indexed, Baisakh = 0
  date: number;
}

/** Today's date expressed in Bikram Sambat. */
export const getTodayBs = (): BsDate => {
  const bs = new NepaliDate(new Date()).getBS();
  return { year: bs.year, month: bs.month, date: bs.date };
};

/** Converts a BS calendar date to a Gregorian 'YYYY-MM-DD' string, built from raw components to avoid Date-object timezone drift. */
export const bsToAdIsoString = (bs: BsDate): string => {
  const ad = new NepaliDate(bs.year, bs.month, bs.date).getAD();
  const mm = String(ad.month + 1).padStart(2, '0');
  const dd = String(ad.date).padStart(2, '0');
  return `${ad.year}-${mm}-${dd}`;
};

/** Number of days in a given BS month (BS months don't have a fixed length). */
export const daysInBsMonth = (year: number, month: number): number => {
  let count = 0;
  const cursor = new NepaliDate(year, month, 1);
  const startMonth = cursor.getMonth();
  while (cursor.getMonth() === startMonth) {
    count += 1;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
};

export const addBsMonths = (year: number, month: number, delta: number): { year: number; month: number } => {
  let m = month + delta;
  let y = year;
  while (m < 0) { m += 12; y -= 1; }
  while (m > 11) { m -= 12; y += 1; }
  return { year: y, month: m };
};

export interface BsGridCell {
  bs: BsDate;
  adDay: number;
  inCurrentMonth: boolean;
  isToday: boolean;
}

/** Builds a 7-wide calendar grid for the given BS month, padded with adjacent-month days like a normal calendar. */
export const buildBsMonthGrid = (year: number, month: number): BsGridCell[] => {
  const today = getTodayBs();
  const firstWeekday = new NepaliDate(year, month, 1).getDay(); // 0 = Sunday
  const totalDays = daysInBsMonth(year, month);
  const prev = addBsMonths(year, month, -1);
  const prevDays = daysInBsMonth(prev.year, prev.month);

  const cells: BsGridCell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    const date = prevDays - i;
    cells.push({
      bs: { year: prev.year, month: prev.month, date },
      adDay: new NepaliDate(prev.year, prev.month, date).getAD().date,
      inCurrentMonth: false,
      isToday: false,
    });
  }

  for (let date = 1; date <= totalDays; date++) {
    const isToday = today.year === year && today.month === month && today.date === date;
    cells.push({
      bs: { year, month, date },
      adDay: new NepaliDate(year, month, date).getAD().date,
      inCurrentMonth: true,
      isToday,
    });
  }

  const next = addBsMonths(year, month, 1);
  let trailing = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      bs: { year: next.year, month: next.month, date: trailing },
      adDay: new NepaliDate(next.year, next.month, trailing).getAD().date,
      inCurrentMonth: false,
      isToday: false,
    });
    trailing += 1;
  }

  return cells;
};
