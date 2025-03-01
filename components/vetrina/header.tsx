'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogoutButton } from '@/components/auth/logout-button'
import { NotificationPopover } from '@/components/notifications/notification-popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface HeaderProps {
  userName?: string;
}

export function Header({ userName = 'User Name' }: HeaderProps) {
  const [user, setUser] = useState<{ nome: string; cognome: string; companyName: string | null }>(null)
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/users/current')
        if (!response.ok) throw new Error('Failed to fetch user')
        const data = await response.json()
        setUser(data)
      } catch (error) {
        console.error('Error fetching user:', error)
      }
    }

    fetchUser()
  }, [])

  const initials = user?.companyName 
    ? user.companyName.charAt(0).toUpperCase()
    : 'C'

  const fullName = user 
    ? `${user.nome} ${user.cognome}`
    : 'User Name'

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo e navigazione */}
          <div className="flex items-center gap-6">
            <Logo className="h-8 w-auto" />
            <nav className="flex gap-6">
              <Link 
                href="/vetrina/brands" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Brands
              </Link>
              <Link 
                href="/vetrina/orders" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Orders
              </Link>
            </nav>
          </div>

          {/* Menu utente */}
          <div className="flex items-center gap-2">
            <NotificationPopover />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative flex items-center gap-2 hover:bg-transparent"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-sm font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">
                      {user?.companyName || 'Company Name'}
                    </p>
                    <p className="text-sm font-normal text-muted-foreground">
                      {fullName}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <Link href="/vetrina/settings">Settings</Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="flex items-center text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                  onSelect={(e) => e.preventDefault()}
                >
                  <LogoutButton />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
