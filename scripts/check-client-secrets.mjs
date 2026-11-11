import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const clientRoots = [".next/static", ".open-next/assets/_next/static"];
const files = [];

async function collectFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(fullPath);
    } else {
      files.push(fullPath);
    }
  }
}

for (const root of clientRoots) {
  try {
    await collectFiles(root);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

if (files.length === 0) {
  throw new Error("No client bundle files found; run this check after a successful Next.js build.");
}

const forbiddenValues = [
  "SUPABASE_SERVICE_ROLE_KEY",
  process.env.SUPABASE_SERVICE_ROLE_KEY,
].filter((value) => value && value.length >= 8);
const leaks = [];

for (const file of files) {
  const contents = await readFile(file, "utf8");
  if (forbiddenValues.some((value) => contents.includes(value))) leaks.push(file);
}

if (leaks.length > 0) {
  throw new Error(`Potential service-role secret found in client bundle(s): ${leaks.join(", ")}`);
}

console.log(`Client bundle secret scan passed (${files.length} files checked).`);
