import type { Metadata } from 'next'
import { Outfit, Fraunces } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'my_tms',
  description: 'Translation Management System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${fraunces.variable}`}>
      <body className={`${outfit.className} min-h-screen text-slate-800 antialiased relative z-10`}>
        {children}
      </body>
    </html>
  )
}
