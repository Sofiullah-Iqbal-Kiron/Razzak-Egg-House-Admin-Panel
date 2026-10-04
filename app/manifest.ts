import type { MetadataRoute } from "next"

import { BASE_PATH } from "@/lib/base-path"

export const dynamic = "force-static"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "রাজ্জাক এগ হাউস — ক্যাশ মেমো",
    short_name: "রাজ্জাক এগ",
    description: "রাজ্জাক এগ হাউসের বিক্রয় ও ক্যাশ মেমো প্রিন্ট",
    start_url: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1f5f30",
    lang: "bn",
    icons: [
      { src: `${BASE_PATH}/icon.svg`, sizes: "any", type: "image/svg+xml" },
    ],
  }
}
