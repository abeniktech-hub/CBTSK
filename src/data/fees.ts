export const fees = {
  masterOfArts: {
    internalStudents: { amount: 20000, currency: "CFA" },
    extensionCenterStudents: { amount: 25000, currency: "CFA" },
  },
  bachelorOfArts: { amount: 15000, currency: "cfa" },
  diploma: { amount: 12000, currency: "cfa" },
} as const;

export function formatFee(amount: number, currency: string): string {
  return `${amount.toLocaleString("en-US")} ${currency}`;
}
