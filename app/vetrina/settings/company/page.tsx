'use client'

import { useState, useEffect } from 'react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AddressAutocomplete } from '@/components/ui/address-autocomplete'

interface CompanyData {
  id: string
  ragione_sociale: string
  partita_iva: string
  indirizzo: string
  cap: string
  citta: string
  provincia: string
  telefono: string
  email: string
  pec: string
  sdi: string
}

export default function CompanySettingsPage() {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCompanyData()
  }, [])

  const fetchCompanyData = async () => {
    try {
      const response = await fetch('/api/company')
      if (!response.ok) throw new Error('Failed to fetch company data')
      const data = await response.json() as CompanyData
      setCompanyData(data)
    } catch (error) {
      toast.error("Failed to load company data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyData) return

    setSaving(true)
    try {
      const response = await fetch('/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyData)
      })

      if (!response.ok) throw new Error('Failed to update company data')

      toast.success("Company information has been updated")
    } catch (error) {
      toast.error("Failed to update company information")
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
        <h3 className="text-lg font-medium">Company Settings</h3>
        <p className="text-sm text-muted-foreground">
          Update your company information and billing details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="ragione_sociale">Company Name</Label>
          <Input
            id="ragione_sociale"
            value={companyData?.ragione_sociale || ''}
            onChange={e => setCompanyData(prev => prev ? { ...prev, ragione_sociale: e.target.value } : null)}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="partita_iva">VAT Number</Label>
            <Input
              id="partita_iva"
              value={companyData?.partita_iva || ''}
              onChange={e => setCompanyData(prev => prev ? { ...prev, partita_iva: e.target.value } : null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sdi">SDI Code</Label>
            <Input
              id="sdi"
              value={companyData?.sdi || ''}
              onChange={e => setCompanyData(prev => prev ? { ...prev, sdi: e.target.value } : null)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Address</Label>
          <AddressAutocomplete
            defaultValue={companyData?.indirizzo}
            onAddressSelect={(address) => {
              if (companyData) {
                setCompanyData({
                  ...companyData,
                  indirizzo: address.street,
                  cap: address.postalCode,
                  citta: address.city,
                  provincia: address.province,
                })
              }
            }}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="cap">Postal Code</Label>
            <Input
              id="cap"
              value={companyData?.cap || ''}
              onChange={e => setCompanyData(prev => prev ? { ...prev, cap: e.target.value } : null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="citta">City</Label>
            <Input
              id="citta"
              value={companyData?.citta || ''}
              onChange={e => setCompanyData(prev => prev ? { ...prev, citta: e.target.value } : null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provincia">Province</Label>
            <Input
              id="provincia"
              value={companyData?.provincia || ''}
              onChange={e => setCompanyData(prev => prev ? { ...prev, provincia: e.target.value } : null)}
            />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={companyData?.email || ''}
              onChange={e => setCompanyData(prev => prev ? { ...prev, email: e.target.value } : null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pec">PEC</Label>
            <Input
              id="pec"
              type="email"
              value={companyData?.pec || ''}
              onChange={e => setCompanyData(prev => prev ? { ...prev, pec: e.target.value } : null)}
            />
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