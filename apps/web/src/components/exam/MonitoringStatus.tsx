"use client"

import { Badge } from '@/components/ui/badge'
import { Activity, AlertTriangle, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MonitoringMetrics {
  tabSwitchesOut: number
  tabSwitchesIn: number
  screenLocks: number
  windowBlurs: number
  copyAttempts: number
  pasteAttempts: number
  zoomChanges: number
  riskScore: number
}

interface MonitoringStatusProps {
  metrics: MonitoringMetrics
  isElectronApp: boolean
  isVM: boolean
  appVersion?: string | null
  maxTabSwitches?: number
  mode?: 'electron' | 'browser'
}

export function MonitoringStatus({
  metrics,
  isElectronApp,
  isVM,
  maxTabSwitches = 3,
  mode = 'electron'
}: MonitoringStatusProps) {
  if (mode === 'electron' && !isElectronApp) {
    return null
  }

  // Check if over limit based on tab switches out
  const isOverLimit = metrics.tabSwitchesOut >= maxTabSwitches
  const isWarning = metrics.tabSwitchesOut >= maxTabSwitches - 1 && !isOverLimit

  return (
    <div className="flex items-center gap-3">
      {/* Tab Switches Monitor - Simplified View */}
      <div className="flex items-center gap-2 bg-white text-slate-700 px-3 py-1.5 rounded-md shadow-sm border border-slate-200">
        <span className="text-sm font-medium">Window</span>
        <span className="text-sm text-slate-400">(</span>
        <span className="text-sm text-green-600">In: {metrics.tabSwitchesIn}</span>
        <span className="text-sm text-slate-300">|</span>
        <span className={cn(
          "text-sm",
          isOverLimit ? "text-red-600 font-bold" : isWarning ? "text-orange-500" : "text-red-500"
        )}>
          Out: {metrics.tabSwitchesOut}
        </span>
        <span className="text-sm text-slate-400">)</span>
      </div>

      {/* VM Detection Badge */}
      {isVM && (
        <div 
          className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 shadow-sm"
          title="Virtual Machine environment detected. This has been flagged for review."
        >
          <Monitor className="h-4 w-4 text-red-600" />
          <Badge variant="destructive" className="text-xs font-semibold">
            VM Detected
          </Badge>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </div>
      )}
    </div>
  )
}
