"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { Section } from "@/types/content";

interface GenerateExamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExamGenerated: (sections: Section[]) => void;
}

interface SectionConfig {
  id: string;
  title: string;
  type: "mcq" | "coding";
  count: number;
  difficulty: string;
  status: "pending" | "generating" | "completed" | "error";
}

export function GenerateExamModal({ open, onOpenChange, onExamGenerated }: GenerateExamModalProps) {
  const [topic, setTopic] = useState("");
  const [sections, setSections] = useState<SectionConfig[]>([
    { id: "1", title: "Section 1", type: "mcq", count: 5, difficulty: "Beginner", status: "pending" }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(-1);

  const addSection = () => {
    setSections([
      ...sections,
      {
        id: Math.random().toString(36).substr(2, 9),
        title: `Section ${sections.length + 1}`,
        type: "mcq",
        count: 5,
        difficulty: "Beginner",
        status: "pending"
      }
    ]);
  };

  const removeSection = (id: string) => {
    if (sections.length > 1) {
      setSections(sections.filter(s => s.id !== id));
    }
  };

  const updateSection = (id: string, updates: Partial<SectionConfig>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    const generatedSections: Section[] = [];

    for (let i = 0; i < sections.length; i++) {
      setCurrentSectionIndex(i);
      const sectionConfig = sections[i];
      
      updateSection(sectionConfig.id, { status: "generating" });

      try {
        const response = await fetch("/api/ai/generate-exam-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            topic,
            difficulty: sectionConfig.difficulty,
            sectionTitle: sectionConfig.title,
            questionType: sectionConfig.type,
            count: sectionConfig.count
          })
        });

        if (!response.ok) throw new Error("Failed to generate section");

        const data = await response.json();
        
        generatedSections.push({
          id: Math.random(), // Temporary ID
          title: sectionConfig.title,
          description: `Generated ${sectionConfig.type.toUpperCase()} section for ${topic}`,
          isVisible: true,
          questions: data.questions.map((q: any, idx: number) => ({
            ...q,
            id: Math.random(), // Temporary ID
            isVisible: true
          }))
        });

        updateSection(sectionConfig.id, { status: "completed" });
      } catch (error) {
        console.error(error);
        updateSection(sectionConfig.id, { status: "error" });
      }
    }

    setIsGenerating(false);
    setCurrentSectionIndex(-1);
    onExamGenerated(generatedSections);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-blue-900">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Generate Exam with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label>Exam Topic / Description</Label>
              <Textarea 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Python Data Structures, React Hooks, Java OOP..."
                className="mt-1"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Exam Sections</Label>
              <Button onClick={addSection} variant="outline" size="sm" disabled={isGenerating}>
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </div>

            <div className="space-y-3">
              {sections.map((section, index) => (
                <div key={section.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1 grid grid-cols-12 gap-3">
                    <div className="col-span-4">
                      <Label className="text-xs text-gray-500">Section Title</Label>
                      <Input 
                        value={section.title}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        disabled={isGenerating}
                        className="h-8 mt-1"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs text-gray-500">Type</Label>
                      <Select 
                        value={section.type} 
                        onValueChange={(val: "mcq" | "coding") => updateSection(section.id, { type: val })}
                        disabled={isGenerating}
                      >
                        <SelectTrigger className="h-8 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mcq">Multiple Choice</SelectItem>
                          <SelectItem value="coding">Coding</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs text-gray-500">Difficulty</Label>
                      <Select 
                        value={section.difficulty} 
                        onValueChange={(val) => updateSection(section.id, { difficulty: val })}
                        disabled={isGenerating}
                      >
                        <SelectTrigger className="h-8 mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                          <SelectItem value="Elite">Elite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-gray-500">Count</Label>
                      <Input 
                        type="number"
                        value={section.count}
                        onChange={(e) => updateSection(section.id, { count: parseInt(e.target.value) || 1 })}
                        min={1}
                        max={20}
                        disabled={isGenerating}
                        className="h-8 mt-1"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center pt-6">
                    {section.status === "generating" ? (
                      <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    ) : section.status === "completed" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeSection(section.id)}
                        disabled={sections.length === 1 || isGenerating}
                        className="h-8 w-8 text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={!topic || isGenerating}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Section {currentSectionIndex + 1}/{sections.length}...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Exam
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
