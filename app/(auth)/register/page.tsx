'use client'
import { RegisterForm } from '@/components/auth/register-form'
import { Logo } from '@/components/ui/logo'
import { useMediaQuery } from '@/hooks/use-media-query'

// Creiamo un componente separato per gli step
interface StepsIndicatorProps {
  currentStep: number;
}

function StepsIndicator({ currentStep }: StepsIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center space-x-8">
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${currentStep === 1 
              ? 'border-2 border-black text-black' 
              : 'bg-green-500 text-white'}`}
          >
            {currentStep === 1 ? '1' : '✓'}
          </div>
          <span className="mt-2 text-xs text-gray-600">Personal Info</span>
        </div>
        <div className="flex-1 h-px bg-gray-200" />
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${currentStep === 2 
              ? 'border-2 border-black text-black' 
              : 'border-2 border-gray-200 text-gray-400'}`}
          >
            2
          </div>
          <span className="mt-2 text-xs text-gray-600">Business Info</span>
        </div>
      </div>
    </div>
  )
}

// Desktop Component
function DesktopRegister() {
  return (
    <div className="min-h-screen flex">
      <div className="fixed top-0 left-0 w-1/3 h-full bg-[#F3F0F5]">
        <div className="absolute top-8 left-8 z-10">
          <Logo className="h-8 w-auto text-white" />
        </div>
        <div className="h-full w-full">
          <video 
            src="https://cdn.dribbble.com/uploads/48226/original/b8bd4e4273cceae2889d9d259b04f732.mp4?1689028949"
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
      </div>

      <div className="ml-[45.1%] flex-1 min-h-screen flex items-center justify-center">
        <div className="w-[480px] px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Create New Account
            </h1>
            <p className="mt-2 text-base text-gray-600">
              Complete the steps to create your business account
            </p>
          </div>
          <RegisterForm StepsIndicator={StepsIndicator} />
        </div>
      </div>
    </div>
  )
}

// Mobile Component
function MobileRegister() {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8">
      <Logo className="h-8 w-auto text-blue-600 mb-8" />
      <div className="w-full max-w-[400px]">
        <RegisterForm StepsIndicator={StepsIndicator} />
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  return isDesktop ? <DesktopRegister /> : <MobileRegister />
}