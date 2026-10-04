import type { Metadata } from "next"
import { Noto_Serif_Bengali } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toast"
import { BASE_PATH } from "@/lib/base-path"
import { cn } from "@/lib/utils"

const notoSerifBengali = Noto_Serif_Bengali({
  subsets: ["bengali", "latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "রাজ্জাক এগ হাউস | Razzak Egg House",
  description: "রাজ্জাক এগ হাউসের ক্যাশ মেমো",
  applicationName: "রাজ্জাক এগ হাউস",
  icons: { icon: `${BASE_PATH}/icon.svg`, apple: `${BASE_PATH}/icon.svg` },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="bn"
      suppressHydrationWarning
      className={cn("antialiased", "font-sans", notoSerifBengali.variable)}
    >
      <body>
        <ThemeProvider>
          <Toaster>{children}</Toaster>
        </ThemeProvider>
      </body>
    </html>
  )
}
