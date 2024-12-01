'use client'
import { LoginForm } from '@/components/auth/login-form'
import { Logo } from '@/components/ui/logo'
import { useMediaQuery } from '@/hooks/use-media-query'

// Desktop Component
function DesktopLogin() {
  return (
    <div className="min-h-screen flex">
      <div className="fixed top-0 left-0 w-1/3 h-full bg-[#F3F0F5]">
        <div className="absolute top-8 left-8 z-10">
          <Logo className="h-8 w-auto text-white" />
        </div>
        <div className="h-full w-full">
          <img 
            src="https://images.unsplash.com/photo-1689714334417-02cf01483e88?fm=jpg&q=60&w=3000&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGNvbG9yJTIwcGF0dGVybnxlbnwwfHwwfHx8MA%3D%3D"
            alt="Authentication illustration"
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      <div className="ml-[45.1%] flex-1 min-h-screen flex items-center justify-center">
        <div className="w-[480px] px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Sign in to your account
            </h1>
            <p className="mt-2 text-base text-gray-600">
              Welcome back! Please enter your details
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

// Mobile Component
function MobileLogin() {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <Logo className="h-8 w-auto text-red-500 mb-8" />
      <div className="w-full max-w-[400px]">
        <LoginForm />
      </div>
    </div>
  )
}

export default function LoginPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  return isDesktop ? <DesktopLogin /> : <MobileLogin />
}