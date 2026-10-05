/**
 * Shop details printed on the cash memo: the phone numbers under the shop
 * name and the address in the footer. Edit these to match the shop.
 */
export const SHOP: {
  name: string
  address: string
  /** Latin digits, e.g. "01712345678". Leave empty to hide. */
  phones: string[]
} = {
  name: "রাজ্জাক এগ হাউস",
  address: "আবু সাঈদের বাজার, কামরাঙ্গীরচর, ঢাকা",
  phones: ["01754380773", "01974380773"],
}

/** Shown in the credit line at the very end of the page. */
export const DEVELOPER = {
  name: "Sofiullah Iqbal Kiron",
  url: "https://www.linkedin.com/in/sofiullah-iqbal-kiron/",
}
