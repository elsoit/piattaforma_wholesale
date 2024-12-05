// layout.tsx (Server Component)
import { Inter } from 'next/font/google'
import './globals.css'
import { TransitionWrapper } from '@/components/layout/transition-wrapper'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          async
          defer
        />
      </head>
      <body>
        <TransitionWrapper>
          {children}
        </TransitionWrapper>
      </body>
    </html>
  )
}

export const metadata = {
  title: 'Piattaforma Wholesale',
  description: 'Piattaforma per la gestione dei cataloghi wholesale',
}
