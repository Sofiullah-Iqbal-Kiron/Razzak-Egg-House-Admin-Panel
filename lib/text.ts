/** All interface and memo text. */
export const T = {
  appName: "রাজ্জাক এগ হাউস",
  theme: {
    toggle: "থিম বদলান",
    light: "লাইট",
    dark: "ডার্ক",
    system: "ডিভাইসের মতো",
  },
  printer: "প্রিন্টার",
  connecting: "সংযোগ হচ্ছে…",

  customerTitle: "ক্রেতার তথ্য",
  customerDescription: "তারিখ ও সময় ছাড়া সবকিছু ঐচ্ছিক।",
  date: "তারিখ",
  time: "সময়",
  hour: "ঘণ্টা",
  minute: "মিনিট",
  am: "পূর্বাহ্ণ",
  pm: "অপরাহ্ণ",
  noMatch: "মিলছে না",
  customerName: "ক্রেতার নাম",
  customerNamePlaceholder: "ক্রেতার নাম লিখুন",
  mobile: "মোবাইল",
  mobilePlaceholder: "০১৭১২৩৪৫৬৭৮",

  productsTitle: "পণ্য বাছাই করুন",
  productsDescription: "চাপ দিলে বিলে যোগ হবে, আবার চাপ দিলে পরিমাণ বাড়বে।",
  otherItem: "অন্য পণ্য",
  otherItemDescription: "তালিকায় নেই এমন পণ্য",

  billTitle: "বিলের পণ্য",
  billDescription: "পরিমাণ ও দর বদলাতে পারবেন।",
  emptyTitle: "এখনো কোনো পণ্য যোগ করা হয়নি",
  emptyDescription: "উপরের তালিকা থেকে পণ্য বাছাই করুন।",
  perUnit: (unit: string) => `প্রতি ${unit}`,
  quantity: "পরিমাণ",
  rate: "দর",
  total: "মোট",
  decrease: "কমান",
  increase: "বাড়ান",
  remove: (name: string) => `${name} বাদ দিন`,

  summaryTitle: "হিসাব",
  summaryDescription: "বকেয়া বা ছাড় দিন, মোট দেখুন।",
  due: "বকেয়া",
  discount: "ছাড়",
  subtotal: "সর্বমোট",
  grandTotal: "মোট টাকা",
  itemCount: "মোট আইটেম",

  previewTitle: "মেমো প্রিভিউ",
  previewDescription: "ঠিক এভাবেই কাগজে প্রিন্ট হবে।",
  print: "প্রিন্ট",
  printMemo: "মেমো প্রিন্ট করুন",
  printing: "প্রিন্ট হচ্ছে…",
  newBill: "নতুন বিল",
  newBillTitle: "নতুন বিল শুরু করবেন?",
  newBillDescription: "বর্তমান বিলের সব তথ্য মুছে যাবে।",
  cancel: "বাতিল",
  confirm: "হ্যাঁ, নতুন বিল",

  customTitle: "অন্য পণ্য যোগ করুন",
  customDescription: "এই পণ্যটি শুধু বর্তমান বিলে যোগ হবে।",
  itemName: "পণ্যের নাম",
  itemNamePlaceholder: "যেমন: চিড়া",
  unit: "একক",
  ratePerUnit: (unit: string) => `দর (প্রতি ${unit})`,
  addToBill: "বিলে যোগ করুন",

  printerTitle: "ব্লুটুথ প্রিন্টার",
  printerDescription:
    "Rongta RPP300 বা যেকোনো ৮০ মিমি ব্লুটুথ থার্মাল প্রিন্টার।",
  printerConnected: (name: string) => `${name} সংযুক্ত`,
  printerRemembered: (name: string) =>
    `${name}, প্রিন্টের সময় আবার সংযুক্ত হবে`,
  printerNone: "কোনো প্রিন্টার সংযুক্ত নেই",
  on: "চালু",
  off: "বন্ধ",
  printerStep1: "প্রিন্টার চালু করুন, ফোনের ব্লুটুথ ও লোকেশন অন রাখুন।",
  printerStep2:
    "নিচের বাটনে চাপ দিয়ে তালিকা থেকে প্রিন্টারটি (যেমন RPP300) বাছাই করুন।",
  printerStep3: "এরপর শুধু প্রিন্ট চাপলেই মেমো সরাসরি প্রিন্ট হবে।",
  findPrinter: "প্রিন্টার খুঁজুন",
  choosePrinter: "অন্য প্রিন্টার বাছাই",
  disconnect: "সংযোগ বিচ্ছিন্ন করুন",
  unsupportedTitle: "সরাসরি ব্লুটুথ প্রিন্ট সম্ভব নয়",
  unsupportedDescription:
    "অ্যান্ড্রয়েডে Google Chrome দিয়ে https লিংকে পেজটি খুলুন, অথবা সিস্টেম প্রিন্ট ব্যবহার করুন।",
  or: "অথবা",
  systemPrintHint:
    "ফোনের প্রিন্ট অপশন দিয়ে প্রিন্ট করুন (RawBT প্রিন্ট সার্ভিস ইনস্টল থাকলে)।",
  systemPrint: "সিস্টেম প্রিন্ট",

  toastPrinted: "মেমো প্রিন্ট হয়েছে",
  toastConnected: (name: string) => `${name} সংযুক্ত হয়েছে`,
  toastPrintFailed: "প্রিন্ট করা যায়নি",
  toastPrintFailedHint:
    "প্রিন্টার চালু ও কাছে আছে কিনা দেখুন, তারপর আবার চেষ্টা করুন।",
  errorNoBluetooth: "এই ব্রাউজারে ব্লুটুথ সাপোর্ট নেই।",
  errorUnknown: "অজানা সমস্যা হয়েছে।",
  errorNoWritable:
    "এই ডিভাইসে প্রিন্ট করার উপায় পাওয়া যায়নি। সঠিক প্রিন্টার বাছাই করুন।",

  developedBy: "অ্যাপটি তৈরি ও পরিচালনা করেছেন",
  developerProfile: "লিংকডইন প্রোফাইল দেখুন",

  // Printed memo
  cashMemo: "ক্যাশ মেমো",
  customer: "ক্রেতা",
  item: "পণ্য",
  noItems: "কোনো পণ্য যোগ করা হয়নি",
}
