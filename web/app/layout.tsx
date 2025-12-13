import type { Metadata } from 'next'
import { Fredoka } from 'next/font/google'
import './globals.css'

const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'ynai',
  description: 'A delightful way to categorize your YNAB transactions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={fredoka.variable}>
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
