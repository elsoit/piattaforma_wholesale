"use client"

import Link from 'next/link'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Errore durante il login')
      }

      if (data.user.ruolo === 'admin') {
        router.push('/dashboard')
      } else {
        router.push('/vetrina')
      }
      
      router.refresh()
    } catch (err) {
      console.error('Errore login:', err)
      setError(err instanceof Error ? err.message : 'Credenziali non valide')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full bg-white rounded-lg shadow-md p-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm mb-8">
        <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Accedi al tuo account
        </h2>
      </div>

      {error && (
        <div className="mb-6 p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label 
            htmlFor="email" 
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Email
          </label>
          <div className="mt-2">
            <input
              id="email"
              name="email"
              type="email"
              required
              className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              placeholder="nome@esempio.com"
            />
          </div>
        </div>

        <div>
          <label 
            htmlFor="password" 
            className="block text-sm font-medium leading-6 text-gray-900"
          >
            Password
          </label>
          <div className="mt-2 relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              className="block w-full rounded-md border-0 py-1.5 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
            >
              {showPassword ? 
                <EyeOff className="h-5 w-5 text-gray-400" /> : 
                <Eye className="h-5 w-5 text-gray-400" />
              }
            </button>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500">oppure</span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/register"
            className="flex w-full justify-center rounded-md bg-white px-3 py-1.5 text-sm font-semibold leading-6 text-blue-600 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
          >
            Registra la tua azienda
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        <Link
          href="/forgot-password"
          className="font-semibold text-blue-600 hover:text-blue-500"
        >
          Password dimenticata?
        </Link>
      </p>
    </div>
  )
}