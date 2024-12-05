'use client'

import { useEffect } from 'react'
import { Bell, Book, Info, Loader2, ShoppingBag, Store, Timer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotifications } from '@/hooks/use-notifications'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

export function NotificationPopover() {
  const router = useRouter()
  const { notifications, unreadCount, loading, markAsRead, refreshNotifications } = useNotifications()

  useEffect(() => {
    console.log('Notifications state:', { loading, count: notifications.length, unreadCount })
  }, [loading, notifications, unreadCount])

  const handleNotificationClick = (id: number) => {
    if (!notifications.find(n => n.id === id)?.read) {
      markAsRead(id)
    }
  }

  const handleViewCatalogs = (brandId: string, notificationId: number) => {
    markAsRead(notificationId)
    router.push(`/vetrina/brands/${brandId}`)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BRAND_ACTIVATION':
        return <Store className="h-4 w-4" />
      case 'CATALOG_ADDED':
        return <Book className="h-4 w-4" />
      case 'BRAND_EXPIRED':
        return <Timer className="h-4 w-4" />
      case 'ORDER_STATUS':
        return <ShoppingBag className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'BRAND_ACTIVATION':
        return 'text-emerald-500'
      case 'CATALOG_ADDED':
        return 'text-blue-500'
      case 'BRAND_EXPIRED':
        return 'text-red-500'
      case 'ORDER_STATUS':
        return 'text-amber-500'
      default:
        return 'text-blue-500'
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          aria-label="Notifications"
          className="relative"
          onClick={() => {
            if (loading) {
              console.log('Forcing notifications refresh...')
              refreshNotifications()
            }
          }}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {unreadCount}
                </span>
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <ScrollArea className="h-[32rem]">
          <div className="flex flex-col">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <h4 className="text-sm font-semibold">Notifications</h4>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            <div className="flex flex-col gap-1 p-2">
              {notifications.length === 0 ? (
                <div className="flex h-32 items-center justify-center">
                  <p className="text-sm text-muted-foreground">
                    {loading ? 'Loading notifications...' : 'No notifications'}
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'group flex flex-col gap-2 rounded-lg p-3 transition-colors hover:bg-muted',
                      !notification.read && 'bg-muted/50'
                    )}
                  >
                    <button
                      className="flex items-start gap-3 text-left"
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-muted transition-colors group-hover:bg-muted group-hover:shadow-md',
                        getNotificationColor(notification.type)
                      )}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className={cn(
                          'text-sm leading-tight',
                          !notification.read && 'font-medium'
                        )}>
                          {notification.message}
                        </p>
                        {notification.brandName && (
                          <p className="text-xs font-medium text-muted-foreground">
                            Brand: {notification.brandName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(notification.createdAt), 'MMM d, yyyy HH:mm', { locale: enUS })}
                        </p>
                      </div>
                    </button>
                    {notification.type === 'BRAND_ACTIVATION' && notification.brandId && (
                      <div className="ml-11">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-center gap-2 rounded-md transition-colors hover:bg-muted"
                          onClick={() => handleViewCatalogs(notification.brandId!, notification.id)}
                        >
                          <Book className="h-4 w-4" />
                          View Catalogs
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
} 