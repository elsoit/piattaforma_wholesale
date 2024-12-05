'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/vetrina/settings/account')
  }, [router])

  return (
    <div className="flex h-[450px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
} 