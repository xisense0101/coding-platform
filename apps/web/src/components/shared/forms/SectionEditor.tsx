'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Trash2 } from 'lucide-react'

export interface Section {
  id: number
  title: string
  description: string
  isVisible: boolean
}

interface SectionEditorProps {
  section: Section
  onUpdate: (section: Section) => void
  onDelete: () => void
  isActive: boolean
  onClick: () => void
}

export function SectionEditor({
  section,
  onUpdate,
  onDelete,
  isActive,
  onClick,
}: SectionEditorProps) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        isActive ? 'border-blue-500 border-2' : 'hover:border-gray-400'
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <Input
            value={section.title}
            onChange={(e) => {
              e.stopPropagation()
              onUpdate({ ...section, title: e.target.value })
            }}
            placeholder="Section title"
            className="flex-1"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Label className="text-sm whitespace-nowrap">Visible:</Label>
              <Switch
                checked={section.isVisible}
                onCheckedChange={(checked) =>
                  onUpdate({ ...section, isVisible: checked })
                }
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {isActive && (
        <CardContent>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={section.description}
              onChange={(e) =>
                onUpdate({ ...section, description: e.target.value })
              }
              placeholder="Section description"
              rows={2}
            />
          </div>
        </CardContent>
      )}
    </Card>
  )
}
