'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  Shield, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Settings, 
  User 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  label: string;
  icon: any;
}

interface DashboardShellProps {
  children: React.ReactNode;
  sidebarItems: SidebarItem[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  userProfile: {
    name?: string;
    email?: string;
    image?: string;
  } | null;
  onLogout: () => void;
  organizationBranding?: {
    logoUrl?: string | null;
    name?: string | null;
  };
  headerActions?: React.ReactNode;
  className?: string;
  colorScheme?: 'blue' | 'emerald' | 'purple';
}

export function DashboardShell({
  children,
  sidebarItems,
  activeSection,
  onSectionChange,
  userProfile,
  onLogout,
  organizationBranding,
  headerActions,
  className,
  colorScheme = 'blue'
}: DashboardShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const colors = {
    blue: {
      activeBg: 'bg-blue-50',
      activeText: 'text-blue-600',
      logoGradient: 'from-blue-600 to-blue-400',
      userGradient: 'from-blue-500 to-purple-500',
      buttonBg: 'bg-blue-600',
      buttonHover: 'hover:bg-blue-700'
    },
    emerald: {
      activeBg: 'bg-emerald-50',
      activeText: 'text-emerald-600',
      logoGradient: 'from-emerald-600 to-emerald-400',
      userGradient: 'from-emerald-500 to-teal-500',
      buttonBg: 'bg-emerald-600',
      buttonHover: 'hover:bg-emerald-700'
    },
    purple: {
      activeBg: 'bg-purple-50',
      activeText: 'text-purple-600',
      logoGradient: 'from-purple-600 to-purple-400',
      userGradient: 'from-purple-500 to-pink-500',
      buttonBg: 'bg-purple-600',
      buttonHover: 'hover:bg-purple-700'
    }
  };

  const theme = colors[colorScheme];

  return (
    <div className={cn("min-h-screen bg-gray-50 flex", className)}>
      {/* Mobile Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-white border-r border-gray-200 flex flex-col fixed h-screen z-50 transition-transform duration-300 lg:translate-x-0",
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {organizationBranding?.logoUrl ? (
                <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center bg-gray-100 shadow-md">
                  <Image 
                    src={organizationBranding.logoUrl} 
                    alt={organizationBranding.name || 'Organization'} 
                    width={40} 
                    height={40}
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className={cn("w-10 h-10 bg-gradient-to-br rounded-lg flex items-center justify-center shadow-md", theme.logoGradient)}>
                  <Shield className="w-6 h-6 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-gray-900 text-base font-semibold">{organizationBranding?.name || 'BlocksCode'}</h1>
                <p className="text-gray-500 text-xs">Portal</p>
              </div>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {sidebarItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onSectionChange(item.id);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                    activeSection === item.id
                      ? cn(theme.activeBg, theme.activeText)
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section - Fixed at bottom */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className={cn("w-10 h-10 bg-gradient-to-br rounded-full flex items-center justify-center text-white flex-shrink-0", theme.userGradient)}>
              <User className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 text-sm font-medium truncate">{userProfile?.name || 'User'}</p>
              <p className="text-gray-500 text-xs truncate">{userProfile?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button & Title */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMobileSidebarOpen(true)}
                  className="lg:hidden p-2 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Menu className="w-6 h-6 text-gray-600" />
                </button>
                <h2 className="text-gray-900 text-lg sm:text-xl font-semibold capitalize">
                  {sidebarItems.find(i => i.id === activeSection)?.label || activeSection}
                </h2>
              </div>

              {/* Right Section */}
              <div className="flex items-center gap-2 sm:gap-3">
                {headerActions}
                <button className="p-2 sm:p-2.5 hover:bg-gray-50 rounded-lg transition-colors relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <button 
                  onClick={() => onSectionChange('profile')}
                  className="p-2 sm:p-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
