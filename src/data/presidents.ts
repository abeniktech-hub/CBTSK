export type President = {
  name: string;
  start: number;
  end: number | null;
};

export const presidents: President[] = [
  { name: "Rev. Dr Wose Paul Mokake", start: 2001, end: 2004 },
  { name: "Rev. Mbzibui Emmanuel Cheng", start: 2004, end: 2005 },
  { name: "Rev. Dr Nditemeh M. Charlemagne", start: 2005, end: 2008 },
  { name: "Rev. Dr Bapmu Patrick Serim", start: 2008, end: 2011 },
  { name: "Rev. Dr Lobe Bernard Metombe", start: 2011, end: 2016 },
  { name: "Rev. Dr Ndeley Samuel Etonge", start: 2016, end: 2017 },
  { name: "Rev. Ebot Arrey", start: 2017, end: 2018 },
  { name: "Rev. Shu Azieh Ndasah", start: 2018, end: 2025 },
  { name: "Chubuin Collins Kabeleh (PhD)", start: 2025, end: null },
];
