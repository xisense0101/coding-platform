import { useEffect, useState } from 'react'
import { useOrganization } from '@/lib/context/OrganizationContext'

interface BrandingConfig {
  logoUrl: string | null
  organizationName: string
  primaryColor: string
  secondaryColor: string
  isLoading: boolean
  hasOrganization: boolean
}

export function useOrganizationBranding(): BrandingConfig {
  const { organization, isLoading } = useOrganization()
  const [branding, setBranding] = useState<BrandingConfig>({
    logoUrl: null,
    organizationName: 'BlocksCode',
    primaryColor: '#3B82F6',
    secondaryColor: '#1E40AF',
    isLoading: true,
    hasOrganization: false
  })

  useEffect(() => {
    if (!isLoading) {
      if (organization) {
        setBranding({
          logoUrl: organization.logo_url || null,
          organizationName: organization.name,
          primaryColor: organization.primary_color || '#3B82F6',
          secondaryColor: organization.secondary_color || '#1E40AF',
          isLoading: false,
          hasOrganization: true
        })

        // Apply CSS variables for dynamic theming
        document.documentElement.style.setProperty('--org-primary-color', organization.primary_color || '#3B82F6')
        document.documentElement.style.setProperty('--org-secondary-color', organization.secondary_color || '#1E40AF')
      } else {
        // Reset to defaults when no organization
        setBranding({
          logoUrl: null,
          organizationName: 'BlocksCode',
          primaryColor: '#3B82F6',
          secondaryColor: '#1E40AF',
          isLoading: false,
          hasOrganization: false
        })
        
        // Reset CSS variables
        document.documentElement.style.setProperty('--org-primary-color', '#3B82F6')
        document.documentElement.style.setProperty('--org-secondary-color', '#1E40AF')
      }
    }
  }, [organization, isLoading])

  return branding
}
