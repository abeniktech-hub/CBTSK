import type { Campus } from "@/data/campuses";

function isPlaceholder(value: string) {
  return value.trim().startsWith("TODO:");
}

export function campusDirectionsUrl(campus: Campus) {
  if (!isPlaceholder(campus.mapsUrl)) {
    let url: URL | null = null;
    try {
      url = new URL(campus.mapsUrl);
    } catch {
      url = null;
    }
    if (url?.protocol === "https:") return url.toString();
  }
  if (isPlaceholder(campus.address) || !campus.address.trim()) return null;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(campus.address)}`;
}

export function isCampusPlaceholder(value: string) {
  return isPlaceholder(value);
}
