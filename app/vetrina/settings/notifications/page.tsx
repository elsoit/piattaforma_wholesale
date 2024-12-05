'use client'

import { useState, useEffect } from 'react'
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface NotificationSettings {
  email: {
    brandActivation: boolean
    catalogAdded: boolean
    brandExpired: boolean
    orderStatus: boolean
  }
  push: {
    brandActivation: boolean
    catalogAdded: boolean
    brandExpired: boolean
    orderStatus: boolean
  }
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      brandActivation: true,
      catalogAdded: true,
      brandExpired: true,
      orderStatus: true
    },
    push: {
      brandActivation: true,
      catalogAdded: true,
      brandExpired: true,
      orderStatus: true
    }
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchNotificationSettings()
  }, [])

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch('/api/notification-settings')
      if (!response.ok) throw new Error('Failed to fetch notification settings')
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      toast.error("Failed to load notification settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch('/api/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (!response.ok) throw new Error('Failed to update notification settings')

      toast.success("Notification settings have been updated")
    } catch (error) {
      toast.error("Failed to update notification settings")
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
        <h3 className="text-lg font-medium">Notification Settings</h3>
        <p className="text-sm text-muted-foreground">
          Choose how you want to receive notifications
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium leading-none mb-4">Email Notifications</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-brand-activation" className="flex flex-col gap-1">
                  <span>Brand Activation</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Receive emails when a brand is activated
                  </span>
                </Label>
                <Switch
                  id="email-brand-activation"
                  checked={settings.email.brandActivation}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, brandActivation: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="email-catalog-added" className="flex flex-col gap-1">
                  <span>New Catalogs</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Receive emails when new catalogs are added
                  </span>
                </Label>
                <Switch
                  id="email-catalog-added"
                  checked={settings.email.catalogAdded}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, catalogAdded: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="email-brand-expired" className="flex flex-col gap-1">
                  <span>Brand Expiration</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Receive emails when a brand is about to expire
                  </span>
                </Label>
                <Switch
                  id="email-brand-expired"
                  checked={settings.email.brandExpired}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, brandExpired: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="email-order-status" className="flex flex-col gap-1">
                  <span>Order Status</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Receive emails about order status changes
                  </span>
                </Label>
                <Switch
                  id="email-order-status"
                  checked={settings.email.orderStatus}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      email: { ...prev.email, orderStatus: checked }
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <h4 className="text-sm font-medium leading-none mb-4">Push Notifications</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="push-brand-activation" className="flex flex-col gap-1">
                  <span>Brand Activation</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Receive push notifications when a brand is activated
                  </span>
                </Label>
                <Switch
                  id="push-brand-activation"
                  checked={settings.push.brandActivation}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      push: { ...prev.push, brandActivation: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="push-catalog-added" className="flex flex-col gap-1">
                  <span>New Catalogs</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Receive push notifications when new catalogs are added
                  </span>
                </Label>
                <Switch
                  id="push-catalog-added"
                  checked={settings.push.catalogAdded}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      push: { ...prev.push, catalogAdded: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="push-brand-expired" className="flex flex-col gap-1">
                  <span>Brand Expiration</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Receive push notifications when a brand is about to expire
                  </span>
                </Label>
                <Switch
                  id="push-brand-expired"
                  checked={settings.push.brandExpired}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      push: { ...prev.push, brandExpired: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="push-order-status" className="flex flex-col gap-1">
                  <span>Order Status</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Receive push notifications about order status changes
                  </span>
                </Label>
                <Switch
                  id="push-order-status"
                  checked={settings.push.orderStatus}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      push: { ...prev.push, orderStatus: checked }
                    }))
                  }
                />
              </div>
            </div>
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