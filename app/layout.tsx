import type { Metadata, Viewport } from "next"
import { Geist_Mono, Hind_Siliguri } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { BASE_PATH } from "@/lib/base-path"
import { cn } from "@/lib/utils"

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "রাজ্জাক এগ হাউস — ক্যাশ মেমো",
  description: "রাজ্জাক এগ হাউসের বিক্রয় ও ক্যাশ মেমো প্রিন্ট",
  applicationName: "রাজ্জাক এগ হাউস",
  icons: { icon: `${BASE_PATH}/icon.svg`, apple: `${BASE_PATH}/icon.svg` },
}

export const viewport: Viewport = {
  themeColor: "#1f5f30",
  width: "device-width",
  initialScale: 1,
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
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        hindSiliguri.variable
      )}
    >
      <body>
        <ThemeProvider forcedTheme="light">{children}</ThemeProvider>
      </body>
    </html>
  )
}
