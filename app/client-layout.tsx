'use client'

import { useEffect, useState } from 'react'

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <body 
      className="min-h-screen bg-background font-sans antialiased"
      style={mounted ? {
        transitionProperty: "margin-right",
        transitionDuration: "450ms",
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)"
      } : undefined}
    >
      {children}
    </body>
  )
} 