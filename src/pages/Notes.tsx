import { useState } from "react";
import { Link } from "react-router-dom";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  FileText,
  Eye,
  BookOpen,
  Clock,
  Search,
  Filter,
  ChevronDown,
  MessageCircle,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useNotes } from "@/hooks/useNotes";
import { useToast } from "@/hooks/use-toast";
import { categories } from "@/lib/data";
import { db } from "@/lib/firebase";
import { doc, deleteDoc } from "firebase/firestore";

GlobalWorkerOptions.workerSrc = pdfWorker;

interface Note {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  pdfUrl: string;
  pdfPath?: string;
  instructor: string;
  instructorId: string;
  instructorAvatar: string;
  level: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

export default function Notes() {
  const { user, userData } = useAuth();
  const { notes, loading } = useNotes();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState("");
  const [activePdfTitle, setActivePdfTitle] = useState("");
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [pdfViewerError, setPdfViewerError] = useState("");
  const [pdfPageImages, setPdfPageImages] = useState<string[]>([]);

  const levels = ["All Levels", "Beginner", "Intermediate", "Advanced"];

  const filteredNotes = notes.filter((note) => {
    // For instructors, only show their own notes; for students, show all
    const isApplicableNote =
      userData?.role !== "instructor" || note.instructorId === user?.uid;

    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || note.category === selectedCategory;
    const matchesLevel =
      selectedLevel === "All Levels" || note.level === selectedLevel;
    return isApplicableNote && matchesSearch && matchesCategory && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-500/10 text-green-600 border-green-200";
      case "Intermediate":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-200";
      case "Advanced":
        return "bg-red-500/10 text-red-600 border-red-200";
      default:
        return "bg-gray-500/10 text-gray-600 border-gray-200";
    }
  };

  const buildInlinePdfUrl = (pdfUrl: string, title: string) => {
    const separator = pdfUrl.includes("?") ? "&" : "?";
    return `${pdfUrl}${separator}response-content-disposition=inline; filename="${encodeURIComponent(
      title.replace(/\s+/g, "_"),
    )}.pdf"&response-content-type=application/pdf`;
  };

  const handleViewPdf = async (pdfUrl: string, title: string, pdfPath?: string) => {
    try {
      const inlinePdfUrl = buildInlinePdfUrl(pdfUrl, title);
      setPdfViewerError("");
      setIsPdfLoading(true);
      setActivePdfTitle(title);
      setPdfPageImages([]);
      setIsPdfViewerOpen(true);

      if (userData?.role === "student") {
        if (!user) {
          throw new Error("Not authenticated");
        }

        const idToken = await user.getIdToken();
        const proxyUrl = `/api/notes/pdf?${pdfPath ? `path=${encodeURIComponent(pdfPath)}` : `url=${encodeURIComponent(pdfUrl)}`}`;
        const response = await fetch(proxyUrl, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!response.ok) {
          throw new Error(`Proxy fetch failed (${response.status})`);
        }

        const pdfBytes = await response.arrayBuffer();
        const pdfDoc = await getDocument({ data: pdfBytes }).promise;
        const renderedPages: string[] = [];

        for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
          const page = await pdfDoc.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.4 });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("Failed to initialize canvas context");
          }

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: context, viewport }).promise;
          renderedPages.push(canvas.toDataURL("image/jpeg", 0.92));
        }

        setActivePdfUrl("");
        setPdfPageImages(renderedPages);
        return;
      }

      const viewerUrl = `${inlinePdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
      setActivePdfUrl(viewerUrl);
    } catch (error) {
      console.error("Error opening PDF:", error);
      setPdfViewerError(
        userData?.role === "student"
          ? "Unable to render note pages for this PDF. Please contact support."
          : "Unable to load this PDF preview. Please try again.",
      );
      toast({
        title: "Preview failed",
        description:
          userData?.role === "student"
            ? "Unable to render note pages for this PDF."
            : "Unable to load this PDF preview. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!window.confirm("Are you sure you want to delete this note? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "notes", noteId));
      toast({
        title: "Note deleted",
        description: "Your note has been successfully deleted.",
      });
    } catch (error) {
      console.error("Error deleting note:", error);
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">
            {userData?.role === "instructor" ? "My Study Notes" : "Study Notes"}
          </h1>
          <p className="text-muted-foreground">
            {userData?.role === "instructor"
              ? "Manage and view the study notes you've uploaded for your students."
              : "Access comprehensive study materials and resources from expert instructors."}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search notes by title, description, or instructor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="min-w-[160px] justify-between"
              >
                <span className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {selectedCategory}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              {categories.map((category) => (
                <DropdownMenuItem
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={
                    selectedCategory === category
                      ? "bg-primary/10 text-primary"
                      : ""
                  }
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Level Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="min-w-[140px] justify-between"
              >
                {selectedLevel}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[140px]">
              {levels.map((level) => (
                <DropdownMenuItem
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={
                    selectedLevel === level ? "bg-primary/10 text-primary" : ""
                  }
                >
                  {level}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Category Pills */}
        <div
          className="mb-8 flex flex-wrap gap-2 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category ? "gradient-primary" : ""
              }
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Results Count */}
        <p
          className="mb-6 text-sm text-muted-foreground animate-fade-in"
          style={{ animationDelay: "0.3s" }}
        >
          Showing {filteredNotes.length} note
          {filteredNotes.length !== 1 ? "s" : ""}
        </p>

        {/* Notes Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[300px] w-full animate-pulse rounded-xl bg-muted"
              />
            ))
          ) : filteredNotes.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-heading text-xl font-semibold mb-2">
                {searchTerm ||
                selectedLevel !== "All Levels" ||
                selectedCategory !== "All"
                  ? "No notes found"
                  : "No study notes available"}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {searchTerm ||
                selectedLevel !== "All Levels" ||
                selectedCategory !== "All"
                  ? "Try adjusting your search or filter criteria."
                  : "Check back later for new study materials from instructors."}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <Card
                key={note.id}
                className="hover:shadow-lg transition-shadow group relative"
              >
                <div className="aspect-video w-full overflow-hidden rounded-t-xl bg-muted">
                  <img
                    src={note.thumbnail}
                    alt={note.title}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-2">
                      <Badge className={getLevelColor(note.level)}>
                        {note.level}
                      </Badge>
                      <Badge variant="outline">{note.category}</Badge>
                    </div>
                    {/* Instructor Menu */}
                    {userData?.role === "instructor" && note.instructorId === user?.uid && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // TODO: Open edit modal with note data
                            }}
                            className="cursor-pointer gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleDeleteNote(note.id);
                            }}
                            className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                    {note.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {note.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mb-4">
                    <img
                      src={note.instructorAvatar}
                      alt={note.instructor}
                      className="h-6 w-6 rounded-full"
                    />
                    <span className="text-sm text-muted-foreground">
                      {note.instructor}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    {userData?.hasPaid || userData?.role === "instructor" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleViewPdf(note.pdfUrl, note.title, note.pdfPath)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View PDF
                      </Button>
                    ) : (
                      <div className="w-full text-center">
                        <p className="text-sm text-muted-foreground mb-2">
                          Payment required to access notes
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          size="sm"
                          onClick={() => (window.location.href = "/dashboard")}
                        >
                          Upgrade to Access
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>

                {/* Message Icon for Students */}
                {userData?.role === "student" && userData?.hasPaid && (
                  <div className="absolute bottom-3 right-3">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full shadow-md hover:shadow-lg transition-shadow bg-background/90 backdrop-blur-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Navigate to messages with instructor
                        window.location.href = `/messages?instructor=${note.instructorId}`;
                      }}
                    >
                      <MessageCircle className="h-4 w-4 text-foreground" />
                    </Button>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </main>
      <Dialog
        open={isPdfViewerOpen}
        onOpenChange={(open) => {
          setIsPdfViewerOpen(open);
          if (!open) {
            setActivePdfUrl("");
            setActivePdfTitle("");
            setPdfPageImages([]);
            setPdfViewerError("");
            setIsPdfLoading(false);
          }
        }}
      >
        <DialogContent className="w-[95vw] max-w-5xl h-[85vh] p-0 overflow-hidden border-0 bg-transparent shadow-none">
          <DialogHeader className="sr-only">
            <DialogTitle>{activePdfTitle || "PDF Preview"}</DialogTitle>
            <DialogDescription>
              Previewing the selected study note PDF in an embedded viewer.
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-full w-full bg-muted rounded-md overflow-auto [webkit-overflow-scrolling:touch]">
            <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 bg-gradient-to-b from-black/55 to-transparent px-4 py-2">
              <p className="line-clamp-1 text-sm text-white">{activePdfTitle || "PDF Preview"}</p>
            </div>
            {isPdfLoading ? (
              <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                Loading PDF preview...
              </div>
            ) : pdfViewerError ? (
              <div className="h-full w-full flex items-center justify-center px-6 text-sm text-destructive text-center">
                {pdfViewerError}
              </div>
            ) : userData?.role === "student" ? (
              <div className="h-full w-full overflow-y-auto [webkit-overflow-scrolling:touch] p-3 sm:p-4">
                {pdfPageImages.length > 0 ? (
                  <div className="mx-auto flex max-w-4xl flex-col gap-4">
                    {pdfPageImages.map((pageImage, index) => (
                      <img
                        key={`page-${index + 1}`}
                        src={pageImage}
                        alt={`${activePdfTitle || "Note"} page ${index + 1}`}
                        className="w-full rounded-md bg-white shadow-sm"
                        loading="lazy"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-sm text-muted-foreground">
                    No pages available for preview.
                  </div>
                )}
              </div>
            ) : activePdfUrl ? (
              <object
                data={activePdfUrl}
                type="application/pdf"
                className="h-full w-full"
                aria-label={activePdfTitle || "PDF Preview"}
              >
                <iframe
                  src={activePdfUrl}
                  title={activePdfTitle || "PDF Preview"}
                  className="h-full w-full border-0"
                  referrerPolicy="no-referrer"
                />
              </object>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
