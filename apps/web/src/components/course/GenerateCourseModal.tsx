"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2, CheckCircle2, XCircle, Play, Square } from "lucide-react";

interface GenerateCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseUpdate: (data: any) => void;
}

type GenerationStatus = "idle" | "generating_outline" | "reviewing_outline" | "generating_sections" | "completed" | "stopped" | "error";

interface SectionStatus {
  id: string;
  title: string;
  description: string;
  status: "pending" | "generating" | "completed" | "error";
}

export function GenerateCourseModal({ open, onOpenChange, onCourseUpdate }: GenerateCourseModalProps) {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [includeCoding, setIncludeCoding] = useState(true);
  const [includeMcq, setIncludeMcq] = useState(true);
  const [includeEssay, setIncludeEssay] = useState(true);
  
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [sections, setSections] = useState<SectionStatus[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const resetState = () => {
    setTopic("");
    setDifficulty("Beginner");
    setStatus("idle");
    setSections([]);
    setCurrentSectionIndex(0);
    setErrorMsg("");
    setAbortController(null);
  };

  useEffect(() => {
    if (!open) {
      // Optional: reset state when closed, or keep it to show previous results
    }
  }, [open]);

  const handleGenerateOutline = async () => {
    if (!topic.trim()) return;

    setStatus("generating_outline");
    setErrorMsg("");
    
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch("/api/ai/generate-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          difficulty,
          preferences: { includeCoding, includeMcq, includeEssay }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate outline");
      }

      const data = await response.json();
      
      // Update course basic info immediately
      onCourseUpdate({
        title: data.title,
        description: data.description
      });

      // Set sections for review
      setSections(data.sections.map((s: any, i: number) => ({
        id: `section-${i}`,
        title: s.title,
        description: s.description,
        status: "pending"
      })));

      setStatus("reviewing_outline");
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setStatus("stopped");
      } else {
        console.error(error);
        setErrorMsg(error.message || "Failed to generate outline. Please try again.");
        setStatus("error");
      }
    }
  };

  const startGeneratingSections = async () => {
    setStatus("generating_sections");
    setCurrentSectionIndex(0);
    processNextSection(0);
  };

  const processNextSection = async (index: number) => {
    if (index >= sections.length) {
      setStatus("completed");
      return;
    }

    // Update status of current section to generating
    setSections(prev => prev.map((s, i) => i === index ? { ...s, status: "generating" } : s));
    setCurrentSectionIndex(index);

    const section = sections[index];
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await fetch("/api/ai/generate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionTitle: section.title,
          sectionDescription: section.description,
          courseTopic: topic,
          difficulty,
          preferences: { includeCoding, includeMcq, includeEssay }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error Details:", errorData);
        throw new Error(errorData.error || errorData.details || `Failed to generate section ${section.title}`);
      }

      const data = await response.json();

      // Send the completed section data to the parent component
      onCourseUpdate({
        newSection: {
          title: section.title,
          description: section.description,
          questions: data.questions
        }
      });

      // Mark section as completed
      setSections(prev => prev.map((s, i) => i === index ? { ...s, status: "completed" } : s));

      // Move to next section
      processNextSection(index + 1);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setStatus("stopped");
        setSections(prev => prev.map((s, i) => i === index ? { ...s, status: "pending" } : s));
      } else {
        console.error(error);
        // Mark as error but maybe continue? or stop? Let's stop for now.
        setSections(prev => prev.map((s, i) => i === index ? { ...s, status: "error" } : s));
        setStatus("error");
        setErrorMsg(`Error generating section: ${section.title}`);
      }
    }
  };

  const handleStop = () => {
    if (abortController) {
      abortController.abort();
    }
    setStatus("stopped");
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val && (status === "generating_outline" || status === "generating_sections")) {
        // Prevent closing while generating or warn user
        if (confirm("Generation is in progress. Are you sure you want to close?")) {
          handleStop();
          onOpenChange(false);
        }
      } else {
        onOpenChange(val);
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Generate Course with AI
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Input Phase */}
          {(status === "idle" || status === "error" || status === "generating_outline") && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Course Topic</Label>
                <Textarea 
                  placeholder="e.g. Advanced Python Patterns for Data Science" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={status === "generating_outline"}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty} disabled={status === "generating_outline"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                      <SelectItem value="Elite">Elite</SelectItem>
                      <SelectItem value="Mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Include Question Types</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="coding" checked={includeCoding} onCheckedChange={(c) => setIncludeCoding(!!c)} disabled={status === "generating_outline"} />
                    <label htmlFor="coding" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Coding</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="mcq" checked={includeMcq} onCheckedChange={(c) => setIncludeMcq(!!c)} disabled={status === "generating_outline"} />
                    <label htmlFor="mcq" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">MCQ</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="essay" checked={includeEssay} onCheckedChange={(c) => setIncludeEssay(!!c)} disabled={status === "generating_outline"} />
                    <label htmlFor="essay" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Essay</label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Review & Generation Phase */}
          {(status === "reviewing_outline" || status === "generating_sections" || status === "completed" || status === "stopped") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Course Outline</h3>
                <span className="text-xs text-gray-500">
                  {sections.filter(s => s.status === "completed").length} / {sections.length} sections generated
                </span>
              </div>
              
              <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                {sections.map((section, idx) => (
                  <div key={section.id} className="p-3 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-6 flex justify-center">
                        {section.status === "pending" && <div className="w-2 h-2 rounded-full bg-gray-300" />}
                        {section.status === "generating" && <Loader2 className="w-4 h-4 animate-spin text-blue-600" />}
                        {section.status === "completed" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        {section.status === "error" && <XCircle className="w-4 h-4 text-red-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{section.title}</p>
                        <p className="text-xs text-gray-500 truncate max-w-[300px]">{section.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              {errorMsg}
            </div>
          )}
        </div>

        <DialogFooter>
          {status === "idle" || status === "error" || status === "generating_outline" ? (
            <Button onClick={handleGenerateOutline} disabled={!topic.trim() || status === "generating_outline"}>
              {status === "generating_outline" ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Outline...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Outline
                </>
              )}
            </Button>
          ) : status === "reviewing_outline" ? (
            <div className="flex gap-2 w-full justify-end">
              <Button variant="outline" onClick={() => setStatus("idle")}>Back</Button>
              <Button onClick={startGeneratingSections} className="bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Start Generating Content
              </Button>
            </div>
          ) : status === "generating_sections" ? (
            <Button variant="destructive" onClick={handleStop}>
              <Square className="w-4 h-4 mr-2 fill-current" />
              Stop Generation
            </Button>
          ) : status === "stopped" ? (
            <div className="flex gap-2 w-full justify-end">
               <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
               <Button onClick={() => processNextSection(currentSectionIndex)}>Resume</Button>
            </div>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
