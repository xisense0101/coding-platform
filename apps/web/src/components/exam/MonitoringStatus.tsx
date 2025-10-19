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
}

export function MonitoringStatus({
  metrics,
  isElectronApp,
  isVM,
  maxTabSwitches = 3
}: MonitoringStatusProps) {
  if (!isElectronApp) {
    return null
  }

  // Check if over limit based on tab switches out
  const isOverLimit = metrics.tabSwitchesOut >= maxTabSwitches
  const isWarning = metrics.tabSwitchesOut >= maxTabSwitches - 1 && !isOverLimit

  return (
    <div className="flex items-center gap-3">
      {/* Tab Switches Monitor - Show In/Out separately without limit */}
      <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border shadow-sm">
        <Activity className={cn(
          "h-4 w-4",
          isOverLimit ? "text-red-600" : isWarning ? "text-orange-600" : "text-sky-600"
        )} />
        <span className="text-xs text-slate-600">Tab Switch</span>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-600">Out:</span>
          <Badge 
            variant={isOverLimit ? "destructive" : isWarning ? "secondary" : "outline"}
            className={cn(
              "text-xs font-semibold",
              isOverLimit && "bg-red-600 text-white",
              isWarning && "bg-orange-500 text-white"
            )}
          >
            {metrics.tabSwitchesOut}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-600">In:</span>
          <Badge 
            variant="outline"
            className="text-xs font-semibold"
          >
            {metrics.tabSwitchesIn}
          </Badge>
        </div>
        {isOverLimit && (
          <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />
        )}
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
