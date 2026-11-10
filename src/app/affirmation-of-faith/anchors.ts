export function articleAnchor(n: string | number): string {
  return `article-${String(n).replace(".", "-")}`;
}
