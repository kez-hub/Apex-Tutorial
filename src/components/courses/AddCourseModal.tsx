import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
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
  SelectValue 
} from "@/components/ui/select";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { categories, Course } from "@/lib/data";
import { Film, BookOpen, Clock, Tag, Layers, Upload, ImageIcon } from "lucide-react";

interface AddCourseModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Course | null;
}

export function AddCourseModal({ isOpen, onOpenChange, initialData }: AddCourseModalProps) {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    level: "Beginner",
    description: "",
    thumbnail: "",
    durationValue: "4",
    durationUnit: "hours",
    lessons: 10,
  });

  // Sync with initialData for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        category: initialData.category || "",
        level: initialData.level || "Beginner",
        description: initialData.description || "",
        thumbnail: initialData.thumbnail || "",
        durationValue: initialData.duration?.split(" ")[0] || "4",
        durationUnit: initialData.duration?.split(" ")[1] || "hours",
        lessons: initialData.lessons || 10,
      });
    } else {
      // Default state for new course
      setFormData({
        title: "",
        category: "",
        level: "Beginner",
        description: "",
        thumbnail: "",
        durationValue: "4",
        durationUnit: "hours",
        lessons: 10,
      });
    }
  }, [initialData, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 2MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, thumbnail: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;

    if (!formData.title || !formData.category || !formData.description) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all the core course details.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const courseId = initialData?.id || `course-${Date.now()}`;
    
    const coursePayload: any = {
      title: formData.title,
      instructor: userData.full_name || user.displayName || "Elite Instructor",
      instructorAvatar: userData?.avatarBase64 || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.full_name || "Instructor")}&background=random`,
      instructorId: user.uid,
      description: formData.description,
      duration: `${formData.durationValue} ${formData.durationUnit}`,
      lessons: formData.lessons,
      category: formData.category,
      level: formData.level,
      thumbnail: formData.thumbnail || "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop",
    };

    // Only set these for new courses
    if (!initialData) {
      coursePayload.id = courseId;
      coursePayload.rating = 5.0;
      coursePayload.students = 0;
    }

    try {
      const courseDocRef = doc(db, "courses", courseId);
      if (initialData) {
        await updateDoc(courseDocRef, coursePayload);
      } else {
        await setDoc(courseDocRef, coursePayload);
      }
      
      toast({
        title: initialData ? "Course Updated! 🛠️" : "Course Published! 🚀",
        description: initialData 
          ? "Your changes have been saved."
          : "Your course is now live and visible to all students.",
      });
      onOpenChange(false);
      // Reset form
      setFormData({
        title: "",
        category: "",
        level: "Beginner",
        description: "",
        thumbnail: "",
        durationValue: "4",
        durationUnit: "hours",
        lessons: 10,
      });
    } catch (err) {
      console.error("Error creating course:", err);
      toast({
        title: "Publication Failed",
        description: "Something went wrong while publishing your course.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto border-border/50 shadow-elevated">
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
            <Film className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            {initialData ? "Edit Masterclass" : "Publish New Course"}
          </DialogTitle>
          <DialogDescription>
            {initialData 
              ? "Update the curriculum details to keep your students informed."
              : "Enter the curriculum details for your new masterclass. This will be visible to all students globally."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-3.5 w-3.5" /> Course Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Masterclass in Advanced Physics"
              className="bg-muted/30 border-muted focus:border-primary transition-all pr-4"
              value={formData.title || ""}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Tag className="h-3.5 w-3.5" /> Category
              </Label>
              <Select 
                value={formData.category || ""} 
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(c => c !== "All").map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Level */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" /> Skill Level
              </Label>
              <Select 
                value={formData.level || "Beginner"} 
                onValueChange={(val) => setFormData({ ...formData, level: val })}
              >
                <SelectTrigger className="bg-muted/30">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="desc" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Short Summary</Label>
            <Textarea
              id="desc"
              placeholder="What will students learn in this course?"
              className="bg-muted/30 border-muted resize-none min-h-[100px]"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> Duration
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  placeholder="e.g. 4.5"
                  className="bg-muted/30"
                  value={formData.durationValue || "0"}
                  onChange={(e) => setFormData({ ...formData, durationValue: e.target.value })}
                />
                <Select 
                  value={formData.durationUnit || "hours"} 
                  onValueChange={(val) => setFormData({ ...formData, durationUnit: val })}
                >
                  <SelectTrigger className="bg-muted/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="mins">Mins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lessons" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" /> Lessons
              </Label>
              <Input
                id="lessons"
                type="number"
                min="1"
                className="bg-muted/30"
                value={formData.lessons}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') e.preventDefault();
                }}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setFormData({ ...formData, lessons: isNaN(val) ? 0 : Math.max(1, val) });
                }}
              />
            </div>
          </div>

          {/* Thumbnail Choice */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ImageIcon className="h-3.5 w-3.5" /> Course Thumbnail
            </Label>
            
            <div className="flex flex-col gap-4">
              {formData.thumbnail && (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/50 shadow-sm bg-muted/50">
                  <img 
                    src={formData.thumbnail} 
                    alt="Preview" 
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7 rounded-full opacity-80 hover:opacity-100"
                    onClick={() => setFormData({ ...formData, thumbnail: "" })}
                  >
                    <Layers className="h-3.5 w-3.5 rotate-45" />
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="thumbnail-upload"
                    onChange={handleImageUpload}
                  />
                  <Label
                    htmlFor="thumbnail-upload"
                    className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                  >
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] font-medium">Upload File</span>
                  </Label>
                </div>

                <div className="space-y-2">
                  <Input
                    placeholder="...or paste Image URL"
                    className="h-20 bg-muted/30 text-xs px-3"
                    value={formData.thumbnail.startsWith('data:') ? "" : formData.thumbnail}
                    onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground italic">Tip: Use 16:9 images for the best appearance on the student dashboard.</p>
          </div>

          <DialogFooter className="sm:justify-end gap-2 pt-4">
            <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
            >
              Discard Draft
            </Button>
            <Button 
                type="submit" 
                variant="gradient" 
                className="px-8 shadow-lg shadow-primary/20"
                disabled={isLoading}
            >
              {isLoading 
                ? (initialData ? "Saving Changes..." : "Publishing World-Wide...") 
                : (initialData ? "Save Changes" : "Launch Course")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
