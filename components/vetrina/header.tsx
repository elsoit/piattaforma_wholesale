'use client'

import Link from 'next/link'
import { Settings, Building2, Bell, LogOut, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogoutButton } from '@/components/auth/logout-button'
import { NotificationPopover } from '@/components/notifications/notification-popover'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
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
  const initials = userName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo e navigazione desktop */}
          <div className="flex items-center gap-6">
            <Logo className="h-8 w-auto" />
            <nav className="hidden md:flex gap-6">
              <Link 
                href="/vetrina/brands" 
                className="text-sm font-medium transition-colors hover:text-primary"
              >
                Brands
              </Link>
            </nav>
          </div>

          {/* Menu mobile */}
          <div className="flex items-center gap-2 md:hidden">
            <NotificationPopover />
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-6">
                  {/* User Info */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-base font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{userName}</p>
                    </div>
                  </div>

                  {/* Navigation */}
                  <nav className="flex flex-col gap-4">
                    <Link 
                      href="/vetrina/brands" 
                      className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary"
                    >
                      Brands
                    </Link>
                  </nav>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" className="justify-start" asChild>
                      <Link href="/vetrina/settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </Button>

                    <Button 
                      variant="ghost" 
                      className="justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                    >
                      <div className="flex items-center gap-2">
                        <LogOut className="h-4 w-4" />
                        <LogoutButton />
                      </div>
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Azioni desktop */}
          <div className="hidden md:flex items-center gap-2">
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
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
                  <LogOut className="mr-2 h-4 w-4" />
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
