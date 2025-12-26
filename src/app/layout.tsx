import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import '@/index.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UFC Picks - Predict. Compete. Win.',
  description: 'Compete with friends predicting UFC fight outcomes. Track your accuracy, climb the leaderboards, and prove you are the ultimate MMA expert.',
  authors: [{ name: 'UFC Picks' }],
  keywords: ['UFC', 'MMA', 'predictions', 'fights', 'leaderboard'],
  openGraph: {
    title: 'UFC Picks - Predict. Compete. Win.',
    description: 'Compete with friends predicting UFC fight outcomes. Track your accuracy and climb the leaderboards.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'UFC Picks',
    description: 'Compete with friends predicting UFC fight outcomes.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
