import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useVideos } from "@/hooks/useVideos";
import { useNotes } from "@/hooks/useNotes";
import {
  ClipboardList,
  BookOpen,
  Clock,
  Target,
  Layers,
  FileText,
} from "lucide-react";

interface Quiz {
  id: string;
  title: string;
  description: string;
  videoId?: string;
  videoTitle?: string;
  noteId?: string;
  noteTitle?: string;
  questions: number;
  duration: number; // in minutes
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
  score?: number;
  maxScore?: number;
  completedAt?: Date;
  instructorId: string;
  instructorName: string;
  createdAt: string;
  updatedAt: string;
}

interface AddQuizModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Quiz | null;
}

export function AddQuizModal({
  isOpen,
  onOpenChange,
  initialData,
}: AddQuizModalProps) {
  const { user, userData } = useAuth();
  const { videos } = useVideos();
  const { notes } = useNotes();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    relatedType: "video" as "video" | "note",
    videoId: "",
    videoTitle: "",
    noteId: "",
    noteTitle: "",
    description: "",
    questions: 10,
    duration: 30,
    difficulty: "easy" as "easy" | "medium" | "hard",
  });

  // Sync with initialData for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        relatedType: (initialData.noteId ? "note" : "video") as
          | "video"
          | "note",
        videoId: initialData.videoId || "",
        videoTitle: initialData.videoTitle || "",
        noteId: initialData.noteId || "",
        noteTitle: initialData.noteTitle || "",
        description: initialData.description || "",
        questions: initialData.questions || 10,
        duration: initialData.duration || 30,
        difficulty: initialData.difficulty || "easy",
      });
    } else {
      // Default state for new quiz
      setFormData({
        title: "",
        relatedType: "video",
        videoId: "",
        videoTitle: "",
        noteId: "",
        noteTitle: "",
        description: "",
        questions: 10,
        duration: 30,
        difficulty: "easy",
      });
    }
  }, [initialData, isOpen]);

  // Update video title when video ID changes
  useEffect(() => {
    if (formData.videoId) {
      const selectedVideo = videos.find((v) => v.id === formData.videoId);
      if (selectedVideo) {
        setFormData((prev) => ({ ...prev, videoTitle: selectedVideo.title }));
      }
    }
  }, [formData.videoId, videos]);

  // Update note title when note ID changes
  useEffect(() => {
    if (formData.noteId) {
      const selectedNote = notes.find((n) => n.id === formData.noteId);
      if (selectedNote) {
        setFormData((prev) => ({ ...prev, noteTitle: selectedNote.title }));
      }
    }
  }, [formData.noteId, notes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;

    const hasRelatedItem =
      formData.relatedType === "video" ? formData.videoId : formData.noteId;

    if (!formData.title || !hasRelatedItem || !formData.description) {
      toast({
        title: "Missing Fields",
        description:
          "Please fill in all required fields including selecting a video or note.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const quizId = initialData?.id || `quiz-${Date.now()}`;

    const quizPayload: Omit<Quiz, "id"> = {
      title: formData.title,
      description: formData.description,
      questions: formData.questions,
      duration: formData.duration,
      difficulty: formData.difficulty,
      completed: false,
      instructorId: user.uid,
      instructorName: userData.full_name || user.displayName || "Instructor",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Conditionally add video or note fields
    if (formData.relatedType === "video") {
      quizPayload.videoId = formData.videoId;
      quizPayload.videoTitle = formData.videoTitle;
    } else {
      quizPayload.noteId = formData.noteId;
      quizPayload.noteTitle = formData.noteTitle;
    }

    try {
      const quizDocRef = doc(db, "quizzes", quizId);
      if (initialData) {
        await updateDoc(quizDocRef, quizPayload);
      } else {
        await setDoc(quizDocRef, quizPayload);
      }

      toast({
        title: initialData ? "Quiz Updated! 🛠️" : "Quiz Created! 📝",
        description: initialData
          ? "Your quiz has been updated."
          : "Your quiz is now available for students.",
      });
      onOpenChange(false);
      // Reset form
      setFormData({
        title: "",
        relatedType: "video",
        videoId: "",
        videoTitle: "",
        noteId: "",
        noteTitle: "",
        description: "",
        questions: 10,
        duration: 30,
        difficulty: "easy",
      });
    } catch (err) {
      console.error("Error creating quiz:", err);
      toast({
        title: "Creation Failed",
        description: "Something went wrong while creating your quiz.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter videos and notes to only show instructor's own items
  const instructorVideos = videos.filter(
    (video) => video.instructorId === user?.uid,
  );
  const instructorNotes = notes.filter(
    (note) => note.instructorId === user?.uid,
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto border-border/50 shadow-elevated">
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary mb-2">
            <ClipboardList className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            {initialData ? "Edit Quiz" : "Create New Quiz"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update your quiz details."
              : "Create an interactive quiz for your students. Select a video and set the quiz parameters."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label
              htmlFor="title"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
            >
              <BookOpen className="h-3.5 w-3.5" /> Quiz Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. JavaScript Fundamentals Quiz"
              className="bg-muted/30 border-muted focus:border-secondary transition-all pr-4"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          {/* Related Content Type */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" /> Related Content Type
            </Label>
            <Select
              value={formData.relatedType}
              onValueChange={(val: "video" | "note") => {
                setFormData({
                  ...formData,
                  relatedType: val,
                  videoId: "",
                  videoTitle: "",
                  noteId: "",
                  noteTitle: "",
                });
              }}
            >
              <SelectTrigger className="bg-muted/30">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="note">Note</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Related Content Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              {formData.relatedType === "video" ? (
                <>
                  <BookOpen className="h-3.5 w-3.5" /> Related Video
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5" /> Related Note
                </>
              )}
            </Label>
            <Select
              value={
                formData.relatedType === "video"
                  ? formData.videoId || ""
                  : formData.noteId || ""
              }
              onValueChange={(val) => {
                if (formData.relatedType === "video") {
                  setFormData({ ...formData, videoId: val });
                } else {
                  setFormData({ ...formData, noteId: val });
                }
              }}
            >
              <SelectTrigger className="bg-muted/30">
                <SelectValue
                  placeholder={`Select a ${formData.relatedType} for this quiz`}
                />
              </SelectTrigger>
              <SelectContent>
                {formData.relatedType === "video"
                  ? instructorVideos.map((video) => (
                      <SelectItem key={video.id} value={video.id}>
                        {video.title}
                      </SelectItem>
                    ))
                  : instructorNotes.map((note) => (
                      <SelectItem key={note.id} value={note.id}>
                        {note.title}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Difficulty */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" /> Difficulty Level
              </Label>
              <Select
                value={formData.difficulty || "easy"}
                onValueChange={(val: "easy" | "medium" | "hard") =>
                  setFormData({ ...formData, difficulty: val })
                }
              >
                <SelectTrigger className="bg-muted/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Questions */}
            <div className="space-y-2">
              <Label
                htmlFor="questions"
                className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
              >
                <Target className="h-3.5 w-3.5" /> Questions
              </Label>
              <Input
                id="questions"
                type="number"
                min="1"
                max="100"
                className="bg-muted/30"
                value={formData.questions}
                onKeyDown={(e) => {
                  if (e.key === "-" || e.key === "e") e.preventDefault();
                }}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFormData({
                    ...formData,
                    questions: isNaN(val) ? 0 : Math.max(1, Math.min(100, val)),
                  });
                }}
              />
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label
              htmlFor="duration"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
            >
              <Clock className="h-3.5 w-3.5" /> Duration (minutes)
            </Label>
            <Input
              id="duration"
              type="number"
              min="5"
              max="180"
              className="bg-muted/30"
              value={formData.duration}
              onKeyDown={(e) => {
                if (e.key === "-" || e.key === "e") e.preventDefault();
              }}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setFormData({
                  ...formData,
                  duration: isNaN(val) ? 0 : Math.max(5, Math.min(180, val)),
                });
              }}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label
              htmlFor="desc"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Description
            </Label>
            <Textarea
              id="desc"
              placeholder="Brief description of what this quiz covers..."
              className="bg-muted/30 border-muted resize-none min-h-[100px]"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          <DialogFooter className="gap-3 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-secondary hover:bg-secondary/90"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {initialData ? "Updating..." : "Creating..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  {initialData ? "Update Quiz" : "Create Quiz"}
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
