import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://cbts-kumba.example",
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 1,
  }];
}