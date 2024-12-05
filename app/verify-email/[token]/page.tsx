'use client'
import { useEffect, useState } from 'react'
import { Logo } from '@/components/ui/logo'
import { CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface VerifyEmailResponse {
  success: boolean
  message: string
  error?: string
}

export default function VerifyEmailPage({ params }: { params: { token: string } }) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: params.token })
        })

        const data = await response.json() as VerifyEmailResponse

        if (response.ok) {
          setStatus('success')
          setMessage(data.message || 'Email verified successfully!')
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
        }
      } catch (error) {
        setStatus('error')
        setMessage('An error occurred during verification')
      }
    }

    verifyEmail()
  }, [params.token])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-[480px] bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-center mb-8">
          <Logo className="h-8 w-auto text-blue-600" />
        </div>
        
        <div className="text-center">
          {status === 'loading' && (
            <div className="animate-pulse space-y-4">
              <div className="h-16 w-16 mx-auto bg-gray-200 rounded-full" />
              <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
            </div>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Email Verified Successfully!
              </h2>
              <div className="mt-4 text-gray-600 space-y-4">
                <p>
                  Your email has been verified. You will receive another email 
                  when your account is activated by our team.
                </p>
                <p>
                  Once activated, you can log in using your email and password.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-700">
                  Please note: Our team will review your information and activate 
                  your account as soon as possible.
                </div>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Verification Failed
              </h2>
              <p className="mt-4 text-gray-600">
                {message}
              </p>
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
                If you continue to have problems, please contact our support team.
              </div>
            </>
          )}

          <div className="mt-8">
            <Link 
              href="/login"
              className="inline-flex items-center justify-center w-full h-12 rounded-md text-sm font-medium text-white bg-black hover:bg-black/90 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 