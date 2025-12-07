"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export interface Organization {
  id: string
  name: string
  subdomain: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
}

interface OrganizationContextType {
  organization: Organization | null
  isLoading: boolean
  refreshOrganization: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadOrganization = async () => {
    try {
      setIsLoading(true)
      
      // Check if we're on an organization subdomain
      const subdomain = extractSubdomainFromWindow()
      
      if (!subdomain) {
        setIsLoading(false)
        return
      }

      // Fetch organization data from API, passing subdomain as query param for local dev
      const url = `/api/organization/current?org=${subdomain}`
      const response = await fetch(url)
      
      if (response.ok) {
        const data = await response.json()
        if (data.organization) {
          setOrganization(data.organization)
        }
      }
    } catch (error) {
      console.error('Error loading organization:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadOrganization()
  }, [])

  const refreshOrganization = async () => {
    await loadOrganization()
  }

  return (
    <OrganizationContext.Provider value={{ organization, isLoading, refreshOrganization }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within OrganizationProvider')
  }
  return context
}

// Helper function to extract subdomain from window location
function extractSubdomainFromWindow(): string | null {
  if (typeof window === 'undefined') return null
  
  const hostname = window.location.hostname
  const parts = hostname.split('.')
  
  // Handle localhost and IP addresses
  if (hostname.includes('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(hostname)) {
    // For local development, check query parameter
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('org')
  }
  
  // Need at least subdomain.domain.tld (3 parts)
  if (parts.length >= 3) {
    const subdomain = parts[0]
    // Don't treat 'www' or 'blockscode' as organization subdomain
    if (subdomain === 'www' || subdomain === 'blockscode') {
      return null
    }
    return subdomain
  }
  
  return null
}
