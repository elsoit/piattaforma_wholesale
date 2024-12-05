import { Inter } from 'next/font/google'
import './globals.css'
import Script from 'next/script'
import { ClientProviders } from '@/components/client-providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Piattaforma Wholesale',
  description: 'Piattaforma per la gestione dei cataloghi wholesale',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="lazyOnload"
        />
      </head>
      <body suppressHydrationWarning className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
