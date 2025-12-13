import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ynai - Sticker Preview',
  description: 'A delightful way to categorize your YNAB transactions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
