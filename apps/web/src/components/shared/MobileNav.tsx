'use client'

import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useUIStore } from '@/lib/stores'

export interface NavLink {
  href: string
  label: string
  icon?: React.ReactNode
}

export interface MobileNavProps {
  links: NavLink[]
  className?: string
}

export function MobileNav({ links, className }: MobileNavProps) {
  const { isMobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useUIStore()

  return (
    <div className={cn('lg:hidden', className)}>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMobileMenu}
        className="p-2"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </Button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeMobileMenu}
          />
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-lg z-50 transform transition-transform duration-300">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Menu</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeMobileMenu}
                className="p-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
