function bytesFromHex(value) {
  if (!/^[a-f0-9]{64}$/i.test(value)) return null;
  return new Uint8Array(value.match(/.{2}/g).map((pair) => Number.parseInt(pair, 16)));
}

export async function signatureMatches(secret, rawBody, supplied) {
  if (!supplied?.startsWith("sha256=")) return false;
  const suppliedBytes = bytesFromHex(supplied.slice(7));
  if (!suppliedBytes) return false;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)));
  if (expected.length !== suppliedBytes.length) return false;
  let mismatch = 0;
  for (let index = 0; index < expected.length; index += 1) mismatch |= expected[index] ^ suppliedBytes[index];
  return mismatch === 0;
}
