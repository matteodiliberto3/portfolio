import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: absoluteUrl("/per-chi"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/metodologia"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/prenota"),
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
