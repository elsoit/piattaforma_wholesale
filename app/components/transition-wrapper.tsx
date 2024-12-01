'use client'

import { useEffect, useState } from 'react'

interface TransitionWrapperProps {
  children: React.ReactNode
}

export function TransitionWrapper({ children }: TransitionWrapperProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div
      className={`transition-all duration-450 ease-in-out ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  )
} 