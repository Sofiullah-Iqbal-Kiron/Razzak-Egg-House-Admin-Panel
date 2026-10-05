import type { Lang } from "@/lib/i18n"

/**
 * Shop details printed on the cash memo: the phone numbers under the shop
 * name and the address in the footer. Edit these to match the shop.
 */
export const SHOP: {
  name: Record<Lang, string>
  address: Record<Lang, string>
  /** Latin digits, e.g. "01712345678". Leave empty to hide. */
  phones: string[]
} = {
  name: { bn: "রাজ্জাক এগ হাউস", en: "Razzak Egg House" },
  address: {
    bn: "আবু সাঈদের বাজার, কামরাঙ্গীরচর, ঢাকা",
    en: "Abu Sayed Market, Kamrangirchar, Dhaka",
  },
  phones: ["01754380773", "01974380773"],
}
