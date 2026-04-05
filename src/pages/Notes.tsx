import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Eye,
  BookOpen,
  Clock,
  Search,
  Filter,
  ArrowRight,
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
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useNotes } from "@/hooks/useNotes";

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
  createdAt: string;
  updatedAt: string;
}

export default function Notes() {
  const { userData } = useAuth();
  const { notes, loading } = useNotes();
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");

  const filteredNotes = notes.filter((note) => {
    const matchesSearch =
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.instructor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || note.level === levelFilter;
    return matchesSearch && matchesLevel;
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

  const handleViewPdf = (pdfUrl: string, title: string) => {
    try {
      // Check if it's a data URL
      if (pdfUrl.startsWith("data:")) {
        // Convert data URL to blob
        const arr = pdfUrl.split(",");
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
        const bstr = atob(arr[1]);
        const n = bstr.length;
        const u8arr = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
          u8arr[i] = bstr.charCodeAt(i);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
        // Clean up the blob URL after a delay
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      } else {
        // Regular URL
        window.open(pdfUrl, "_blank");
      }
    } catch (error) {
      console.error("Error opening PDF:", error);
      alert("Failed to open PDF. Please try downloading instead.");
    }
  };

  const handleDownloadPdf = (pdfUrl: string, title: string) => {
    try {
      const link = document.createElement("a");

      if (pdfUrl.startsWith("data:")) {
        // Convert data URL to blob for data URLs
        const arr = pdfUrl.split(",");
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : "application/pdf";
        const bstr = atob(arr[1]);
        const n = bstr.length;
        const u8arr = new Uint8Array(n);
        for (let i = 0; i < n; i++) {
          u8arr[i] = bstr.charCodeAt(i);
        }
        const blob = new Blob([u8arr], { type: mime });
        link.href = URL.createObjectURL(blob);
      } else {
        // Regular URL
        link.href = pdfUrl;
      }

      link.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL if it was created
      if (pdfUrl.startsWith("data:")) {
        setTimeout(() => URL.revokeObjectURL(link.href), 100);
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">Study Notes</h1>
          <p className="text-muted-foreground">
            Access comprehensive study materials and resources from expert
            instructors.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes by title, description, or instructor..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={levelFilter} onValueChange={setLevelFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Beginner">Beginner</SelectItem>
              <SelectItem value="Intermediate">Intermediate</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
                {searchTerm || levelFilter !== "all"
                  ? "No notes found"
                  : "No study notes available"}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {searchTerm || levelFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Check back later for new study materials from instructors."}
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <Card
                key={note.id}
                className="hover:shadow-lg transition-shadow group"
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
                    <Badge className={getLevelColor(note.level)}>
                      {note.level}
                    </Badge>
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
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => handleViewPdf(note.pdfUrl, note.title)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
