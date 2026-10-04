import type { Lang } from "@/lib/i18n"

/**
 * Shop details printed on the cash memo. The address and phone are printed
 * in the footer. Edit these to match the shop.
 */
export const SHOP: {
  name: Record<Lang, string>
  tagline: Record<Lang, string>
  address: Record<Lang, string>
  /** Latin digits, e.g. "01712345678". Leave empty to hide. */
  phone: string
} = {
  name: { bn: "রাজ্জাক এগ হাউস", en: "Razzak Egg House" },
  tagline: {
    bn: "মানসম্মত ডিম, পাইকারি ও খুচরা",
    en: "Quality eggs, wholesale and retail",
  },
  address: {
    bn: "আবু সাঈদের বাজার, কামরাঙ্গীরচর, ঢাকা",
    en: "Abu Sayed Market, Kamrangirchar, Dhaka",
  },
  phone: "",
}
