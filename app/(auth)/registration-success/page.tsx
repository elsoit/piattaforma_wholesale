'use client'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Logo } from '@/components/ui/logo'
import { useMediaQuery } from '@/hooks/use-media-query'

// Desktop Component
function DesktopSuccess() {
  return (
    <div className="min-h-screen flex">
      <div className="fixed top-0 left-0 w-1/3 h-full bg-[#F3F0F5]">
        <div className="absolute top-8 left-8 z-10">
          <Logo className="h-8 w-auto text-blue-600" />
        </div>
        <div className="h-full w-full">
          <img 
            src="https://placehold.co/600x400/F3F0F5/1a1a1a?text=Authentication"
            alt="Authentication illustration"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="ml-[45.1%] flex-1 min-h-screen flex items-center justify-center">
        <div className="w-[480px] px-8">
          <div className="text-center">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Registration Request Submitted!
            </h2>
            
            <div className="mt-4 text-gray-600 space-y-4">
              <p>
                Thank you for registering. Please check your email to verify your account.
              </p>
              
              <p>
                After verifying your email, our team will review your information 
                and activate your account. You'll receive another email when your 
                account is active.
              </p>

              <p className="text-sm bg-yellow-50 p-4 rounded-md border border-yellow-200">
                Important: Please check your spam folder if you don't see the verification 
                email in your inbox.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              <Link 
                href="/login"
                className="inline-flex items-center justify-center w-full h-12 rounded-md text-sm font-medium text-white bg-black hover:bg-black/90 transition-colors"
              >
                Go to Login
              </Link>
              
              <p className="text-sm text-gray-500">
                Need help? {' '}
                <a 
                  href="mailto:support@domain.com" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Contact us
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mobile Component
function MobileSuccess() {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <Logo className="h-8 w-auto text-blue-600 mb-8" />
      <div className="w-full max-w-[400px] text-center">
        <div className="flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        
        <h2 className="mt-6 text-3xl font-bold text-gray-900">
          Registration Request Submitted!
        </h2>
        
        <div className="mt-4 text-gray-600 space-y-4">
          <p>
            Thank you for registering. Please check your email to verify your account.
          </p>
          
          <p>
            After verifying your email, our team will review your information 
            and activate your account. You'll receive another email when your 
            account is active.
          </p>

          <p className="text-sm bg-yellow-50 p-4 rounded-md border border-yellow-200">
            Important: Please check your spam folder if you don't see the verification 
            email in your inbox.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Link 
            href="/login"
            className="inline-flex items-center justify-center w-full h-12 rounded-md text-sm font-medium text-white bg-black hover:bg-black/90 transition-colors"
          >
            Go to Login
          </Link>
          
          <p className="text-sm text-gray-500">
            Need help? {' '}
            <a 
              href="mailto:support@domain.com" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegistrationSuccessPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  return isDesktop ? <DesktopSuccess /> : <MobileSuccess />
} 