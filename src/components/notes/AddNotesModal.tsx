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
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { categories } from "@/lib/data";
import {
  FileText,
  BookOpen,
  Upload,
  ImageIcon,
  Layers,
  Tag,
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  pdfUrl: string;
  instructor: string;
  instructorId: string;
  instructorAvatar: string;
  level: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface AddNotesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Note | null;
}

export function AddNotesModal({
  isOpen,
  onOpenChange,
  initialData,
}: AddNotesModalProps) {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    level: "Beginner",
    category: "",
    description: "",
    thumbnail: "",
    pdfUrl: "",
  });

  // Sync with initialData for editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        level: initialData.level || "Beginner",
        category: initialData.category || "",
        description: initialData.description || "",
        thumbnail: initialData.thumbnail || "",
        pdfUrl: initialData.pdfUrl || "",
      });
      setPdfFile(null);
      setThumbnailFile(null);
    } else {
      // Default state for new note
      setFormData({
        title: "",
        level: "Beginner",
        category: "",
        description: "",
        thumbnail: "",
        pdfUrl: "",
      });
      setPdfFile(null);
      setThumbnailFile(null);
    }
    setUploadProgress(0);
  }, [initialData, isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit for thumbnails
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      // Validate image type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file.",
          variant: "destructive",
        });
        return;
      }

      // Store file object (not Base64)
      setThumbnailFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setFormData((prev) => ({
        ...prev,
        thumbnail: previewUrl,
      }));
      
      toast({
        title: "Image selected",
        description: `${file.name} - will upload when you publish.`,
      });
    }
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size limit based on user role (Blaze plan allows larger files)
      const maxSize =
        userData?.role === "instructor" ? 1024 * 1024 * 1024 : 50 * 1024 * 1024; // 1GB for instructors, 50MB for students
      const maxSizeText = userData?.role === "instructor" ? "1GB" : "50MB";

      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `Please upload a PDF smaller than ${maxSizeText}.`,
          variant: "destructive",
        });
        return;
      }

      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        return;
      }

      // Store the file object (not Base64)
      setPdfFile(file);
      toast({
        title: "PDF selected",
        description: `${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) - will upload when you publish.`,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userData) return;

    // Check required fields
    if (!formData.title || !formData.description) {
      toast({
        title: "Missing Fields",
        description: "Please fill in title and description.",
        variant: "destructive",
      });
      return;
    }

    // Check if we have a PDF (either new file or existing URL)
    if (!pdfFile && !formData.pdfUrl) {
      toast({
        title: "Missing PDF",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const noteId = initialData?.id || `note-${Date.now()}`;

    try {
      let pdfDownloadUrl = formData.pdfUrl;
      let thumbnailDownloadUrl = formData.thumbnail;

      // Upload new Thumbnail to Cloud Storage if selected
      if (thumbnailFile) {
        const thumbnailPath = `notes/${user.uid}/${noteId}/thumbnail`;
        const thumbnailRef = ref(storage, thumbnailPath);
        
        await uploadBytes(thumbnailRef, thumbnailFile);
        thumbnailDownloadUrl = await getDownloadURL(thumbnailRef);
      }

      // Upload new PDF to Cloud Storage if selected
      if (pdfFile) {
        const pdfPath = `notes/${user.uid}/${noteId}/${pdfFile.name}`;
        const pdfRef = ref(storage, pdfPath);
        
        // Upload with real-time progress tracking
        const uploadTask = uploadBytesResumable(pdfRef, pdfFile);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              // Update progress in real-time
              const progress = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              );
              setUploadProgress(Math.min(progress, 95)); // Cap at 95% until complete
            },
            (error) => {
              reject(error);
            },
            () => {
              // Upload complete
              setUploadProgress(95);
              resolve(uploadTask);
            }
          );
        });
        
        // Get download URL
        pdfDownloadUrl = await getDownloadURL(pdfRef);
        setUploadProgress(100);
      }

      const notePayload: Omit<Note, "id"> = {
        title: formData.title,
        instructor: userData.full_name || user.displayName || "Elite Instructor",
        instructorAvatar:
          userData?.avatarBase64 ||
          user.photoURL ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(userData?.full_name || "Instructor")}&background=random`,
        instructorId: user.uid,
        description: formData.description,
        level: formData.level,
        category: formData.category,
        thumbnail:
          thumbnailDownloadUrl ||
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop",
        pdfUrl: pdfDownloadUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUploadProgress(90);
      
      const noteDocRef = doc(db, "notes", noteId);
      if (initialData) {
        await updateDoc(noteDocRef, notePayload);
      } else {
        await setDoc(noteDocRef, notePayload);
      }

      setUploadProgress(100);
      
      toast({
        title: initialData ? "Notes Updated! 🛠️" : "Notes Published! 📚",
        description: initialData
          ? "Your changes have been saved."
          : "Your notes are now available to all students.",
      });
      onOpenChange(false);
      // Reset form
      setFormData({
        title: "",
        level: "Beginner",
        category: "",
        description: "",
        thumbnail: "",
        pdfUrl: "",
      });
      setPdfFile(null);
      setThumbnailFile(null);
      setUploadProgress(0);
    } catch (err) {
      console.error("Error creating notes:", err);
      toast({
        title: "Publication Failed",
        description: "Something went wrong while publishing your notes. Check file size and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto border-border/50 shadow-elevated">
        <DialogHeader>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent mb-2">
            <FileText className="h-6 w-6" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            {initialData ? "Edit Notes" : "Publish Study Notes"}
          </DialogTitle>
          <DialogDescription>
            {initialData
              ? "Update your study notes details."
              : "Share comprehensive study notes with your students. Include a PDF and thumbnail image."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label
              htmlFor="title"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
            >
              <BookOpen className="h-3.5 w-3.5" /> Notes Title
            </Label>
            <Input
              id="title"
              placeholder="e.g. Complete Physics Formula Sheet"
              className="bg-muted/30 border-muted focus:border-accent transition-all pr-4"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
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
                onValueChange={(val) =>
                  setFormData({ ...formData, category: val })
                }
              >
                <SelectTrigger className="bg-muted/30">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c !== "All")
                    .map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Level */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Layers className="h-3.5 w-3.5" /> Difficulty Level
              </Label>
              <Select
                value={formData.level || "Beginner"}
                onValueChange={(val) =>
                  setFormData({ ...formData, level: val })
                }
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
            <Label
              htmlFor="desc"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Description
            </Label>
            <Textarea
              id="desc"
              placeholder="Brief description of what these notes cover..."
              className="bg-muted/30 border-muted resize-none min-h-[100px]"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ImageIcon className="h-3.5 w-3.5" /> Thumbnail Image
            </Label>

            <div className="flex flex-col gap-4">
              {formData.thumbnail && (
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border/50 shadow-sm bg-muted/50">
                  <img
                    src={formData.thumbnail}
                    alt="Thumbnail Preview"
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-7 w-7 rounded-full opacity-80 hover:opacity-100"
                    onClick={() => {
                      setFormData({ ...formData, thumbnail: "" });
                      setThumbnailFile(null);
                    }}
                  >
                    <Layers className="h-3.5 w-3.5 rotate-45" />
                  </Button>
                </div>
              )}

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
                  <span className="text-xs text-muted-foreground">
                    {formData.thumbnail
                      ? "Change thumbnail"
                      : "Upload thumbnail image"}
                  </span>
                </Label>
              </div>
            </div>
          </div>

          {/* PDF Upload */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> PDF Document *
            </Label>

            <div className="flex flex-col gap-4">
              {(pdfFile || formData.pdfUrl) && (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-green-50/50">
                  <FileText className="h-6 w-6 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {pdfFile ? pdfFile.name : "PDF uploaded successfully"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {pdfFile
                        ? `${(pdfFile.size / 1024 / 1024).toFixed(2)}MB - will upload on publish`
                        : "Ready to publish"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setFormData({ ...formData, pdfUrl: "" });
                      setPdfFile(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}

              <div className="relative">
                <Input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  id="pdf-upload"
                  onChange={handlePdfUpload}
                />
                <Label
                  htmlFor="pdf-upload"
                  className="flex h-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formData.pdfUrl ? "Change PDF" : "Upload PDF document"}
                  </span>
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-6">
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Uploading PDF...</span>
                  <span className="font-medium">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
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
              className="bg-accent hover:bg-accent/90"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {initialData ? "Updating..." : "Publishing..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  {initialData ? "Update Notes" : "Publish Notes"}
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
