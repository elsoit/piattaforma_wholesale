'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import PhoneInput from 'react-phone-number-input'
import { isValidPhoneNumber } from 'libphonenumber-js'
import { toast } from "sonner"

interface UserData {
  id: string
  nome: string
  cognome: string
  email: string
  telefono: string
  ruolo: string
  attivo: boolean
  created_at: string
  updated_at: string
}

export default function AccountSettingsPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/users/me')
      if (!response.ok) throw new Error('Failed to fetch user data')
      const data = await response.json() as UserData
      setUserData(data)
    } catch (error) {
      toast.error("Failed to load user data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userData) return

    setSaving(true)
    try {
      const response = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: userData.nome,
          cognome: userData.cognome,
          telefono: userData.telefono,
        })
      })

      if (!response.ok) throw new Error('Failed to update user data')

      toast.success("Your account has been updated")
    } catch (error) {
      toast.error("Failed to update account")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[450px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account Settings</h3>
        <p className="text-sm text-muted-foreground">
          Update your account settings and personal information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="nome">First Name</Label>
            <Input
              id="nome"
              value={userData?.nome || ''}
              onChange={e => setUserData(prev => prev ? { ...prev, nome: e.target.value } : null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cognome">Last Name</Label>
            <Input
              id="cognome"
              value={userData?.cognome || ''}
              onChange={e => setUserData(prev => prev ? { ...prev, cognome: e.target.value } : null)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            value={userData?.email || ''}
            disabled
            className="bg-muted"
          />
          <p className="text-sm text-muted-foreground">
            Email cannot be changed
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">Phone</Label>
          <PhoneInput
            international
            value={userData?.telefono || ''}
            onChange={(value) => setUserData(prev => prev ? { ...prev, telefono: value || '' } : null)}
            error={userData?.telefono ? (isValidPhoneNumber(userData.telefono) ? undefined : 'Invalid phone number') : undefined}
          />
        </div>

        <div className="space-y-2">
          <Label>Account Status</Label>
          <div className="flex items-center space-x-2">
            <div className={`h-2.5 w-2.5 rounded-full ${userData?.attivo ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-muted-foreground">
              {userData?.attivo ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 