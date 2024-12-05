'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function VerifyEmailPage() {
  const [verifying, setVerifying] = useState(true)
  const searchParams = useSearchParams()
  const router = useRouter()
  
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token = searchParams.get('token')
        const response = await fetch(`/api/auth/verify-email?token=${token}`)
        const data = await response.json()
        
        if (response.ok) {
          toast.success('Email verificata con successo')
          router.push('/login')
        } else {
          toast.error(data.message)
          router.push('/register')
        }
      } catch (error) {
        toast.error('Errore durante la verifica')
        router.push('/register')
      } finally {
        setVerifying(false)
      }
    }

    verifyEmail()
  }, [searchParams, router])

  if (verifying) {
    return <div>Verifica in corso...</div>
  }

  return null
} 