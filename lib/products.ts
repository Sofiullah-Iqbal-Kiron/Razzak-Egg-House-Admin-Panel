export type Product = {
  id: string
  name: string
}

/** The fixed catalog: each item gets its own row on the bill. */
export const PRODUCTS: Product[] = [
  { id: "lal-dim", name: "লাল ডিম" },
  { id: "shada-dim", name: "সাদা ডিম" },
  { id: "hasher-dim", name: "হাঁসের ডিম" },
  { id: "deshi-dim", name: "দেশি মুরগির ডিম" },
  { id: "koyel-dim", name: "কোয়েল পাখির ডিম" },
  { id: "muri", name: "মুড়ি" },
  { id: "chira", name: "চিড়া" },
  { id: "gur", name: "গুড়" },
]
