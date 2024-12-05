'use client'

import { useEffect, useState } from 'react'

export function TransitionWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      className={`transition-[margin-right] duration-450 ease-[cubic-bezier(0.4,0,0.2,1)] ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  )
} 