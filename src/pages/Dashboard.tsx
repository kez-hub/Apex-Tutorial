import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Clock,
  Bell,
  TrendingUp,
  ArrowRight,
  Plus,
  Brain,
  VideoIcon,
  ClipboardList,
  FileText,
  Eye,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VideoCard } from "@/components/videos/VideoCard";
import { videos as initialVideos, Video } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { useVideos } from "@/hooks/useVideos";
import { useNotes } from "@/hooks/useNotes";
import { AddVideoModal } from "@/components/videos/AddVideoModal";
import { AddNotesModal } from "@/components/notes/AddNotesModal";
import { AddQuizModal } from "@/components/quiz/AddQuizModal";

export default function Dashboard() {
  const { user, userData } = useAuth();
  const { videos, loading } = useVideos();
  const { notes } = useNotes();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [videoToEdit, setVideoToEdit] = useState<Video | null>(null);
  const navigate = useNavigate();
  const userName = user?.displayName || user?.email?.split("@")[0] || "User";

  const enrolledVideoIds = userData?.enrolledVideos || [];
  const enrolledVideos = videos.filter((video) =>
    enrolledVideoIds.includes(video.id),
  );
  const upcomingAlarms =
    userData?.alarms?.filter((alarm) => alarm.enabled) || [];

  const filteredDashboardVideos =
    userData?.role === "instructor"
      ? videos.filter((v) => v.instructorId === user?.uid).slice(0, 6)
      : videos.filter((v) => !enrolledVideoIds.includes(v.id)).slice(0, 6);

  const stats = [
    {
      title: "Videos Enrolled",
      value: enrolledVideos.length,
      icon: BookOpen,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Hours Learned",
      value: userData?.hoursLearned || 0,
      icon: Clock,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Learning Streak",
      value: `${userData?.learningStreak || 0} days`,
      icon: TrendingUp,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Alarms Set",
      value: upcomingAlarms.length,
      icon: Bell,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar isAuthenticated />

      <AddVideoModal
        isOpen={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) setVideoToEdit(null);
        }}
        initialData={videoToEdit}
      />

      <AddNotesModal
        isOpen={isNotesModalOpen}
        onOpenChange={setIsNotesModalOpen}
      />

      <AddQuizModal
        isOpen={isQuizModalOpen}
        onOpenChange={setIsQuizModalOpen}
      />

      <main className="container mx-auto px-4 py-8 overflow-hidden">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-3xl font-bold">
            Welcome back, {userName.split(" ")[0]}! 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            {userData?.role === "instructor"
              ? "Manage your videos and inspire your students."
              : "Continue your learning journey and achieve your goals."}
          </p>
        </div>

        {/* Stats Grid - Only shown for students */}
        {userData?.role === "student" && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card
                key={stat.title}
                className="animate-fade-in border-border/50 shadow-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="flex items-center gap-4 p-6">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}
                  >
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="font-heading text-2xl font-bold">
                      {stat.value}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recommended Videos */}
        <section className="mt-12 pb-20">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold">
              {userData?.role === "instructor"
                ? "Videos"
                : "Recommended for You"}
            </h2>
            <Button variant="ghost" asChild>
              <Link to="/videos" className="text-primary">
                Browse All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[300px] w-full animate-pulse rounded-xl bg-muted"
                />
              ))
            ) : filteredDashboardVideos.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/30">
                <div className="mb-4 rounded-full bg-background p-4 shadow-sm">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-heading text-xl font-semibold">
                  No video is available
                </h3>
                <p className="mt-2 text-muted-foreground max-w-xs">
                  Check back later or click "Browse All" to see the full
                  catalog.
                </p>
              </div>
            ) : (
              filteredDashboardVideos.map((video, index) => (
                <div
                  key={video.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <VideoCard
                    video={video}
                    onEdit={(v) => {
                      setVideoToEdit(v);
                      setIsAddModalOpen(true);
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Notes Section - Only for instructors */}
        {userData?.role === "instructor" && (
          <section className="mt-12 pb-20">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold">
                My Study Notes
              </h2>
              <Button variant="ghost" asChild>
                <Link to="/notes" className="text-primary">
                  View All Notes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {notes
                .filter((note) => note.instructorId === user?.uid)
                .slice(0, 3)
                .map((note) => (
                  <Card
                    key={note.id}
                    className="hover:shadow-lg transition-shadow group overflow-hidden"
                  >
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <img
                        src={note.thumbnail}
                        alt={note.title}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded">
                          {note.level}
                        </div>
                      </div>
                      <h3 className="font-heading font-semibold line-clamp-2 mb-1">
                        {note.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-4">
                        {note.description}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          onClick={() => {
                            try {
                              if (note.pdfUrl.startsWith("data:")) {
                                const arr = note.pdfUrl.split(",");
                                const mimeMatch = arr[0].match(/:(.*?);/);
                                const mime = mimeMatch
                                  ? mimeMatch[1]
                                  : "application/pdf";
                                const bstr = atob(arr[1]);
                                const n = bstr.length;
                                const u8arr = new Uint8Array(n);
                                for (let i = 0; i < n; i++) {
                                  u8arr[i] = bstr.charCodeAt(i);
                                }
                                const blob = new Blob([u8arr], { type: mime });
                                const blobUrl = URL.createObjectURL(blob);
                                window.open(blobUrl, "_blank");
                                setTimeout(
                                  () => URL.revokeObjectURL(blobUrl),
                                  100,
                                );
                              } else {
                                window.open(note.pdfUrl, "_blank");
                              }
                            } catch (error) {
                              console.error("Error opening PDF:", error);
                            }
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            try {
                              const link = document.createElement("a");
                              if (note.pdfUrl.startsWith("data:")) {
                                const arr = note.pdfUrl.split(",");
                                const mimeMatch = arr[0].match(/:(.*?);/);
                                const mime = mimeMatch
                                  ? mimeMatch[1]
                                  : "application/pdf";
                                const bstr = atob(arr[1]);
                                const n = bstr.length;
                                const u8arr = new Uint8Array(n);
                                for (let i = 0; i < n; i++) {
                                  u8arr[i] = bstr.charCodeAt(i);
                                }
                                const blob = new Blob([u8arr], { type: mime });
                                link.href = URL.createObjectURL(blob);
                              } else {
                                link.href = note.pdfUrl;
                              }
                              link.download = `${note.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              if (note.pdfUrl.startsWith("data:")) {
                                setTimeout(
                                  () => URL.revokeObjectURL(link.href),
                                  100,
                                );
                              }
                            } catch (error) {
                              console.error("Error downloading PDF:", error);
                            }
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              {notes.filter((note) => note.instructorId === user?.uid)
                .length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/30">
                  <div className="mb-4 rounded-full bg-background p-4 shadow-sm">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold">
                    No notes yet
                  </h3>
                  <p className="mt-2 text-muted-foreground max-w-xs">
                    Create your first study note using the button below!
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Quiz Section - Only for students */}
        {userData?.role === "student" && (
          <section className="mt-12 pb-20">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold">
                Practice Quizzes
              </h2>
              <Button variant="ghost" asChild>
                <Link to="/quiz" className="text-primary">
                  View All Quizzes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Link to="/quiz">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="mb-4 rounded-full bg-primary/10 p-4 group-hover:bg-primary/20 transition-colors">
                      <Brain className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold mb-2">
                      Take a Quiz
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Test your knowledge and track your progress
                    </p>
                    <Button
                      size="sm"
                      className="group-hover:scale-105 transition-transform"
                    >
                      Start Learning
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>

              <Card className="border-green-200 bg-green-50/50">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 rounded-full bg-green-500/10 p-4">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">
                    Your Progress
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Keep practicing to improve your scores
                  </p>
                  <div className="w-full bg-green-100 rounded-full h-2 mb-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    75% Average Score
                  </p>
                </CardContent>
              </Card>

              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 rounded-full bg-blue-500/10 p-4">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2">
                    Video Quizzes
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unlock quizzes by completing video modules
                  </p>
                  <p className="text-2xl font-bold text-blue-600">3</p>
                  <p className="text-xs text-muted-foreground">Available Now</p>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Floating Action Button for Instructors */}
        {userData?.role === "instructor" && (
          <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-3">
            {isFabOpen && (
              <div className="flex flex-col items-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(true);
                    setIsFabOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-full bg-white/95 px-4 py-3 shadow-xl shadow-black/10 ring-1 ring-border transition hover:-translate-y-1"
                  title="Videos"
                >
                  <VideoIcon className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-gray-900">
                    Videos
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsQuizModalOpen(true);
                    setIsFabOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-full bg-white/95 px-4 py-3 shadow-xl shadow-black/10 ring-1 ring-border transition hover:-translate-y-1"
                  title="Quiz"
                >
                  <ClipboardList className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-medium text-gray-900">
                    Quiz
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsNotesModalOpen(true);
                    setIsFabOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-full bg-white/95 px-4 py-3 shadow-xl shadow-black/10 ring-1 ring-border transition hover:-translate-y-1"
                  title="Notes"
                >
                  <FileText className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium text-gray-900">
                    Notes
                  </span>
                </button>
              </div>
            )}

            <button
              type="button"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated hover:scale-110 active:scale-95 transition-all duration-300 animate-fade-in"
              title="Create New Content"
              onClick={() => setIsFabOpen((open) => !open)}
            >
              <Plus className="h-6 w-6 transition-transform duration-300" />
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
