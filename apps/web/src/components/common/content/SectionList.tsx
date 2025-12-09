import React from 'react';
import { Eye, EyeOff, Plus, Zap, Trash2 } from 'lucide-react';
import { Section } from '@/types/content';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SectionListProps {
  sections: Section[];
  activeSectionId: number | null;
  onSelectSection: (id: number) => void;
  onAddSection: () => void;
  onDeleteSection?: (id: number) => void;
  readOnly?: boolean;
}

export function SectionList({
  sections,
  activeSectionId,
  onSelectSection,
  onAddSection,
  onDeleteSection,
  readOnly = false
}: SectionListProps) {
  return (
    <div className="space-y-3 pt-4 border-t">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-gray-900 flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Sections ({sections.length})
        </h3>
      </div>
      <div className="space-y-2">
        {sections.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No sections yet
          </div>
        ) : (
          sections.map((section) => (
            <div
              key={section.id}
              className={cn(
                "group relative w-full p-3 rounded-lg border text-left transition-all cursor-pointer",
                activeSectionId === section.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-300"
              )}
              onClick={() => onSelectSection(section.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate font-medium">
                    {section.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {section.questions.length} question
                    {section.questions.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {section.isVisible ? (
                    <Eye className="w-3 h-3 text-green-600" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-gray-400" />
                  )}
                </div>
              </div>
              
              {!readOnly && onDeleteSection && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSection(section.id);
                  }}
                  className="absolute right-2 top-2 p-1 text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                  title="Delete section"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
      
      {!readOnly && (
        <Button
          onClick={onAddSection}
          className="w-full flex items-center justify-center gap-2"
          variant="outline"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </Button>
      )}
    </div>
  );
}
