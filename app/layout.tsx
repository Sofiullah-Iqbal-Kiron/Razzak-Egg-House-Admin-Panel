import type { Metadata, Viewport } from "next"
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
  title: "রাজ্জাক এগ হাউস",
  description: "রাজ্জাক এগ হাউসের ক্যাশ মেমো",
  // Home-screen app on iPhone and iPad.
  appleWebApp: {
    capable: true,
    title: "রাজ্জাক এগ",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  applicationName: "রাজ্জাক এগ হাউস",
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the phone action bar sit above the home indicator.
  viewportFit: "cover",
  themeColor: "#7008e7",
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
        {/* Launch animation, shown only when opened as the installed app. */}
        <div id="splash" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${BASE_PATH}/icons/icon-512.png`} alt="" />
        </div>
        <ThemeProvider defaultTheme="light">
          <Toaster>{children}</Toaster>
        </ThemeProvider>
      </body>
    </html>
  )
}
