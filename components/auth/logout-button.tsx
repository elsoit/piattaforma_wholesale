"use client"

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const router = useRouter()

  const clearBrowserData = () => {
    // Pulisce tutti i dati della sessione
    sessionStorage.clear()
    
    // Pulisce tutti i dati locali
    localStorage.clear()
    
    // Pulisce tutti i cookie
    document.cookie.split(";").forEach(function(c) {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })

    // Pulisce la cache delle fetch API
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach(name => {
          caches.delete(name)
        })
      })
    }
  }

  const handleLogout = async () => {
    try {
      // Pulisce tutti i dati del browser
      clearBrowserData()
      
      // Effettua il logout
      await signOut({ 
        redirect: true,
        callbackUrl: '/login'
      })

      // Forza un hard refresh della pagina
      window.location.href = '/login'
    } catch (error) {
      console.error('Errore durante il logout:', error)
      // In caso di errore, forziamo comunque il reindirizzamento
      clearBrowserData()
      window.location.href = '/login'
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      className="gap-2 font-medium"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  )
}