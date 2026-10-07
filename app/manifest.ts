import type { MetadataRoute } from "next"

import { BASE_PATH } from "@/lib/base-path"

export const dynamic = "force-static"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: `${BASE_PATH}/`,
    name: "রাজ্জাক এগ হাউস",
    short_name: "রাজ্জাক এগ",
    description: "রাজ্জাক এগ হাউসের ক্যাশ মেমো",
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#7008e7",
    lang: "bn",
    dir: "ltr",
    categories: ["business", "productivity"],
    icons: [
      {
        src: `${BASE_PATH}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${BASE_PATH}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${BASE_PATH}/icons/icon-maskable-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: `${BASE_PATH}/icons/icon-maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
