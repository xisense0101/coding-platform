import React from 'react';
import { Eye, EyeOff, Trash2, Plus, CheckCircle2, Code2, Settings, BookOpen } from 'lucide-react';
import { Section, Question } from '@/types/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { QuestionEditor } from './QuestionEditor';

interface ContentEditorProps {
  activeSection: Section | undefined;
  onUpdateSection: (updates: Partial<Section>) => void;
  onDeleteSection: () => void;
  onAddQuestion: (type: 'mcq' | 'coding' | 'essay') => void;
  onUpdateQuestion: (questionId: number, updates: Partial<Question>) => void;
  onDeleteQuestion: (questionId: number) => void;
  expandedQuestionId: number | null;
  setExpandedQuestionId: (id: number | null) => void;
  readOnly?: boolean;
}

export function ContentEditor({
  activeSection,
  onUpdateSection,
  onDeleteSection,
  onAddQuestion,
  onUpdateQuestion,
  onDeleteQuestion,
  expandedQuestionId,
  setExpandedQuestionId,
  readOnly = false
}: ContentEditorProps) {
  if (!activeSection) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-gray-900 mb-2">No Section Selected</h3>
          <p className="text-gray-500 text-sm mb-4">
            Select a section from the sidebar or create a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Section Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg text-gray-900 font-semibold">Section Settings</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateSection({ isVisible: !activeSection.isVisible })}
              className={activeSection.isVisible ? "text-green-700 bg-green-50 border-green-200 hover:bg-green-100" : "text-gray-600"}
              disabled={readOnly}
            >
              {activeSection.isVisible ? (
                <>
                  <Eye className="w-3 h-3 mr-2" />
                  Visible
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3 mr-2" />
                  Hidden
                </>
              )}
            </Button>
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteSection}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="mb-1 block">Section Title *</Label>
            <Input
              value={activeSection.title}
              onChange={(e) => onUpdateSection({ title: e.target.value })}
              placeholder="Enter section title"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label className="mb-1 block">Section Description</Label>
            <Textarea
              value={activeSection.description}
              onChange={(e) => onUpdateSection({ description: e.target.value })}
              placeholder="Enter section description"
              rows={2}
              className="resize-none"
              disabled={readOnly}
            />
          </div>
          {!readOnly && (
            <div>
              <Label className="mb-2 block">Add Questions</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => onAddQuestion('mcq')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <CheckCircle2 className="w-3 h-3 mr-2" />
                  MCQ Quiz
                </Button>
                <Button
                  onClick={() => onAddQuestion('coding')}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  <Code2 className="w-3 h-3 mr-2" />
                  Coding Challenge
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {activeSection.questions.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-gray-900 mb-2">No Questions Yet</h3>
            <p className="text-gray-500 text-sm">
              Add questions using the buttons above
            </p>
          </div>
        ) : (
          activeSection.questions.map((question) => (
            <QuestionEditor
              key={question.id}
              question={question}
              onUpdate={(updates) => onUpdateQuestion(question.id, updates)}
              onDelete={() => onDeleteQuestion(question.id)}
              isExpanded={expandedQuestionId === question.id}
              onToggleExpand={() => setExpandedQuestionId(expandedQuestionId === question.id ? null : question.id)}
              readOnly={readOnly}
            />
          ))
        )}
      </div>
    </div>
  );
}
