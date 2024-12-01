"use client"

import Link from 'next/link'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

interface LoginResponse {
  user: {
    ruolo: string;
  };
  error?: string;
}

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(event.currentTarget)
    const loginData = {
      email: formData.get('email')?.toString().toLowerCase(),
      password: formData.get('password')?.toString()
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      })

      const data = (await response.json()) as LoginResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante il login')
      }

      console.log('Login response:', data) // Debug log

      // Aspetta che i cookie siano impostati
      await new Promise(resolve => setTimeout(resolve, 100))

      // Reindirizza in base al ruolo
      if (data.user.ruolo === 'admin') {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/vetrina'
      }
      
    } catch (err) {
      console.error('Errore login:', err)
      setError(err instanceof Error ? err.message : 'Credenziali non valide')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full">
      {error && (
        <div className="mb-6 p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label 
            htmlFor="email" 
            className="font-medium text-gray-900"
          >
            Email
          </Label>
          <div className="mt-2">
            <Input
              id="email"
              name="email"
              type="email"
              required
              className="h-12 px-4 bg-white placeholder:text-muted-foreground/50"
              placeholder="nome@esempio.com"
            />
          </div>
        </div>

        <div>
          <Label 
            htmlFor="password" 
            className="font-medium text-gray-900"
          >
            Password
          </Label>
          <div className="mt-2 relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="h-12 px-4 bg-white placeholder:text-muted-foreground/50"
              placeholder="••••••••"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            >
              {showPassword ? 
                <EyeOff className="h-4 w-4 text-gray-400" /> : 
                <Eye className="h-4 w-4 text-gray-400" />
              }
            </Button>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-black hover:bg-black/90 text-white"
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </Button>
        </div>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>
          Don't have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            Sign up here
          </Link>
        </p>
      </div>

      <div className="mt-4 text-center">
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
        >
          Forgot password?
        </Link>
      </div>
    </div>
  )
}