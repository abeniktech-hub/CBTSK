"use client";

import { useState } from "react";

export default function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function copyAddress() {
    setCopied(false);
    setError(false);
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      setError(true);
    }
  }

  return <>
    <button type="button" className="button min-h-11 rounded-md border border-[var(--forest)] text-[var(--forest)]" onClick={() => void copyAddress()}>
      {copied ? "Address copied" : "Copy address"}
    </button>
    {error && <span role="alert" className="self-center text-sm text-[var(--danger)]">Could not copy the address. Please select and copy it manually.</span>}
  </>;
}
