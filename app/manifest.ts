import type { MetadataRoute } from "next"

import { BASE_PATH } from "@/lib/base-path"

export const dynamic = "force-static"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "রাজ্জাক এগ হাউস | Razzak Egg House",
    short_name: "রাজ্জাক এগ",
    description: "রাজ্জাক এগ হাউসের ক্যাশ মেমো",
    start_url: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "bn",
    icons: [
      { src: `${BASE_PATH}/icon.svg`, sizes: "any", type: "image/svg+xml" },
    ],
  }
}
