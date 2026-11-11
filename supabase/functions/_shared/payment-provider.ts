export type PaymentAmount = { amount: number; currency: "CFA" };
export type Checkout = { reference: string; checkoutUrl: string };
export type VerifiedPayment = {
  reference: string;
  status: "PAID" | "PENDING" | "FAILED";
  amount: number;
  currency: "CFA";
};

export interface PaymentProvider {
  createCheckout(amount: PaymentAmount, metadata: Record<string, string>, returnUrl: string): Promise<Checkout>;
  verify(reference: string): Promise<VerifiedPayment>;
}

export class MobileMoneyCardProvider implements PaymentProvider {
  constructor(
    private readonly createUrl: string,
    private readonly verifyUrl: string,
    private readonly apiKey: string,
  ) {}

  async createCheckout(
    amount: PaymentAmount,
    metadata: Record<string, string>,
    returnUrl: string,
  ): Promise<Checkout> {
    const response = await fetch(this.createUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...amount, metadata, return_url: returnUrl }),
    });
    if (!response.ok) throw new Error("The payment provider could not start a transaction.");
    const data = await response.json();
    const checkoutUrl = typeof data.checkout_url === "string" ? new URL(data.checkout_url) : null;
    if (typeof data.reference !== "string" || !checkoutUrl || checkoutUrl.protocol !== "https:") {
      throw new Error("The payment provider returned an invalid checkout response.");
    }
    return { reference: data.reference, checkoutUrl: checkoutUrl.toString() };
  }

  async verify(reference: string): Promise<VerifiedPayment> {
    const response = await fetch(this.verifyUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    });
    if (!response.ok) throw new Error("Provider verification failed.");
    const data = await response.json();
    if (data.reference !== reference || !["PAID", "PENDING", "FAILED"].includes(data.status) ||
        typeof data.amount !== "number" || data.currency !== "CFA") {
      throw new Error("Provider verification returned an invalid response.");
    }
    return { reference, status: data.status, amount: data.amount, currency: data.currency };
  }
}
