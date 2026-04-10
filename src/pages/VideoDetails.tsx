import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Clock,
  Star,
  Users,
  PlayCircle,
  CheckCircle,
  ArrowLeft,
  Lock,
  Plus,
  Upload,
  Edit,
  Trash2,
  Video as VideoIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import {
  doc,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  getDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Video, VideoModule } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function VideoDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modules, setModules] = useState<VideoModule[]>([]);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [editingModule, setEditingModule] = useState<VideoModule | null>(null);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [instructorProfile, setInstructorProfile] = useState<any>(null);
  const [objectives, setObjectives] = useState<string[]>([]);
  const [newObjective, setNewObjective] = useState("");
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    duration: "",
  });

  useEffect(() => {
    if (!id) return;

    const videoDoc = doc(db, "videos", id);
    const unsubscribe = onSnapshot(
      videoDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          const videoData = { ...snapshot.data(), id: snapshot.id } as Video;
          setVideo(videoData);
          setModules(videoData.modules || []);
          setObjectives(videoData.objectives || []);

          // Fetch instructor profile if instructorId exists
          if (videoData.instructorId) {
            const instructorDoc = doc(db, "users", videoData.instructorId);
            getDoc(instructorDoc)
              .then((instructorSnapshot) => {
                if (instructorSnapshot.exists()) {
                  setInstructorProfile(instructorSnapshot.data());
                }
              })
              .catch((error) => {
                console.error("Error fetching instructor profile:", error);
              });
          }
        } else {
          setVideo(null);
          setModules([]);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error loading video:", error);
        setVideo(null);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [id]);

  // Handle editing module
  useEffect(() => {
    if (editingModule) {
      setModuleForm({
        title: editingModule.title,
        description: editingModule.description || "",
        videoUrl: editingModule.videoUrl || "",
        duration: editingModule.duration || "",
      });
    } else {
      setModuleForm({
        title: "",
        description: "",
        videoUrl: "",
        duration: "",
      });
    }
  }, [editingModule]);

  // Module management functions
  const addModule = async (
    moduleData: Omit<VideoModule, "id" | "order" | "createdAt">,
  ) => {
    if (!video || !id) return;

    const newModule: VideoModule = {
      ...moduleData,
      id: `module-${Date.now()}`,
      order: modules.length,
      createdAt: new Date().toISOString(),
    };

    const updatedModules = [...modules, newModule];

    try {
      await updateDoc(doc(db, "videos", id), {
        modules: updatedModules,
        lessons: updatedModules.length,
      });
      setModules(updatedModules);
      toast({
        title: "Module Added",
        description: "Your video module has been added to the video.",
      });
    } catch (error) {
      console.error("Error adding module:", error);
      toast({
        title: "Error",
        description: "Failed to add module. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateModule = async (
    moduleId: string,
    updates: Partial<VideoModule>,
  ) => {
    if (!video || !id) return;

    const updatedModules = modules.map((module) =>
      module.id === moduleId ? { ...module, ...updates } : module,
    );

    try {
      await updateDoc(doc(db, "videos", id), {
        modules: updatedModules,
      });
      setModules(updatedModules);
      toast({
        title: "Module Updated",
        description: "Your module has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating module:", error);
      toast({
        title: "Error",
        description: "Failed to update module. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!video || !id) return;

    const updatedModules = modules.filter((module) => module.id !== moduleId);

    try {
      await updateDoc(doc(db, "videos", id), {
        modules: updatedModules,
        lessons: updatedModules.length,
      });
      setModules(updatedModules);
      toast({
        title: "Module Deleted",
        description: "The module has been removed from your video.",
      });
    } catch (error) {
      console.error("Error deleting module:", error);
      toast({
        title: "Error",
        description: "Failed to delete module. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleModuleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!moduleForm.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your module.",
        variant: "destructive",
      });
      return;
    }

    const moduleData = {
      title: moduleForm.title.trim(),
      description: moduleForm.description.trim(),
      videoUrl: moduleForm.videoUrl.trim(),
      duration: moduleForm.duration.trim(),
    };

    if (editingModule) {
      await updateModule(editingModule.id, moduleData);
      setEditingModule(null);
    } else {
      await addModule(moduleData);
      setIsAddingModule(false);
    }

    setModuleForm({
      title: "",
      description: "",
      videoUrl: "",
      duration: "",
    });
  };

  const isEnrolled = userData?.enrolledVideos?.includes(id || "") || false;

  const handleAddObjective = async () => {
    if (!newObjective.trim() || !id) return;

    const updatedObjectives = [...objectives, newObjective.trim()];
    try {
      await updateDoc(doc(db, "videos", id), {
        objectives: updatedObjectives,
      });
      setObjectives(updatedObjectives);
      setNewObjective("");
      toast({
        title: "Objective Added",
        description: "Your objective has been added successfully.",
      });
    } catch (error) {
      console.error("Error adding objective:", error);
      toast({
        title: "Error",
        description: "Failed to add objective. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteObjective = async (index: number) => {
    if (!id) return;

    const updatedObjectives = objectives.filter((_, i) => i !== index);
    try {
      await updateDoc(doc(db, "videos", id), {
        objectives: updatedObjectives,
      });
      setObjectives(updatedObjectives);
      toast({
        title: "Objective Deleted",
        description: "The objective has been removed.",
      });
    } catch (error) {
      console.error("Error deleting objective:", error);
      toast({
        title: "Error",
        description: "Failed to delete objective. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-heading text-2xl font-bold">Video not found</h1>
          <p className="mt-2 text-muted-foreground">
            The video you're looking for doesn't exist.
          </p>
          <Button asChild className="mt-4">
            <Link to="/videos">Back to Videos</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleEnroll = async () => {
    if (!user || !userData || !video || !id) return;

    // Check if already enrolled
    if (isEnrolled) {
      toast({
        title: "Already enrolled",
        description: "You're already enrolled in this video.",
      });
      return;
    }

    try {
      // Update user's enrolled videos
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        enrolledVideos: arrayUnion(id),
      });

      // Increment video student count
      const videoDocRef = doc(db, "videos", id);
      await updateDoc(videoDocRef, {
        students: increment(1),
      });

      // Update local state
      setVideo((prev) =>
        prev ? { ...prev, students: prev.students + 1, enrolled: true } : null,
      );

      toast({
        title: "Enrolled successfully! 🎉",
        description: `You're now enrolled in "${video.title}"`,
      });
    } catch (error) {
      console.error("Error enrolling in video:", error);
      toast({
        title: "Enrollment failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const learningPoints = [
    "Understand core concepts and best practices",
    "Get lifetime access to video materials",
    "Access to exclusive community",
    "Regular updates with new content",
  ];

  // Check if user has paid (Instructors bypass)
  const isInstructor = userData?.role === "instructor";
  if (
    user &&
    userData &&
    !userData.hasPaid &&
    !video.enrolled &&
    !isInstructor
  ) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center animate-fade-in">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <div className="relative h-24 w-24 rounded-2xl bg-card border border-border shadow-elevated flex items-center justify-center">
              <Lock className="h-12 w-12 text-primary" />
            </div>
          </div>

          <h1 className="text-3xl font-bold font-heading mb-4">Video Locked</h1>
          <p className="text-muted-foreground max-w-md mb-8">
            You need to make a one-time payment to unlock access to "
            {video.title}" and all other premium videos on Apex Tutorials.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="gradient"
              size="lg"
              onClick={() => (window.location.href = "/dashboard")}
            >
              Back to Dashboard
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/videos">Browse Other Videos</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar isAuthenticated />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero border-b border-border">
        <div className="container mx-auto px-4 py-12 overflow-hidden">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link to="/videos">
              <ArrowLeft className="h-4 w-4" />
              Back to Videos
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Video Info */}
            <div className="lg:col-span-2 animate-fade-in">
              <Badge variant="outline" className="mb-4">
                {video.category}
              </Badge>
              <h1 className="mb-4 font-heading text-3xl font-bold md:text-4xl">
                {video.title}
              </h1>
              <p className="mb-6 text-lg text-muted-foreground">
                {video.description}
              </p>

              {/* Stats */}
              <div className="mb-6 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{video.rating}</span>
                  <span className="text-muted-foreground">rating</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{video.students.toLocaleString()} students</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{video.duration}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <VideoIcon className="h-4 w-4" />
                  <span>{modules.length} modules</span>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {video.level}
                </Badge>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={video.instructorAvatar}
                    alt={video.instructor}
                  />
                  <AvatarFallback>{video.instructor.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Instructor</p>
                  <p className="font-semibold">{video.instructor}</p>
                </div>
              </div>
            </div>

            {/* Enrollment Card */}
            <div className="animate-slide-in-right">
              <Card className="sticky top-24 overflow-hidden border-border/50 shadow-elevated max-w-full">
                {isEnrolled ? (
                  <>
                    <VideoPlayer
                      src={
                        modules.length > 0 &&
                        modules[currentModuleIndex]?.videoUrl
                          ? modules[currentModuleIndex].videoUrl
                          : "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                      }
                      poster={video.thumbnail}
                      title={
                        modules.length > 0
                          ? `${modules[currentModuleIndex]?.title || `Lesson ${currentModuleIndex + 1}`}`
                          : `Introduction to ${video.title}`
                      }
                      userId={user?.uid}
                      videoId={id}
                    />
                    {modules.length > 1 && (
                      <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setCurrentModuleIndex(
                              Math.max(0, currentModuleIndex - 1),
                            )
                          }
                          disabled={currentModuleIndex === 0}
                          className="flex items-center gap-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <span className="text-sm font-medium">
                          {currentModuleIndex + 1} of {modules.length}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setCurrentModuleIndex(
                              Math.min(
                                modules.length - 1,
                                currentModuleIndex + 1,
                              ),
                            )
                          }
                          disabled={currentModuleIndex === modules.length - 1}
                          className="flex items-center gap-2"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  {isEnrolled ? (
                    <>
                      {video.progress !== undefined && (
                        <div className="mb-6">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Your Progress
                            </span>
                            <span className="font-semibold text-primary">
                              {video.progress}%
                            </span>
                          </div>
                          <Progress value={video.progress} className="h-3" />
                        </div>
                      )}
                      <Button
                        variant="gradient"
                        className="w-full"
                        size="lg"
                        onClick={() => {
                          const videoPlayer = document.querySelector(
                            "[class*='aspect-video']",
                          );
                          if (videoPlayer) {
                            videoPlayer.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                            // Try to play if it's a regular video element
                            const videoEl = videoPlayer.querySelector("video");
                            if (videoEl) {
                              videoEl.play();
                            }
                          }
                        }}
                      >
                        <PlayCircle className="h-5 w-5" />
                        Continue Learning
                      </Button>
                    </>
                  ) : userData?.role !== "instructor" ? (
                    <Button
                      variant="gradient"
                      className="w-full"
                      size="lg"
                      onClick={handleEnroll}
                    >
                      Enroll Now
                    </Button>
                  ) : null}

                  <Separator className="my-6" />

                  <div className="space-y-3">
                    <h4 className="font-semibold">This video includes:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <PlayCircle className="h-4 w-4" />
                        <span>{modules.length} video modules</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Video Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-12">
            {/* What You'll Learn */}
            <div className="animate-fade-in">
              <h2 className="mb-6 font-heading text-2xl font-bold">
                What You'll Learn
              </h2>
              <Card className="border-border/50">
                <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
                  {learningPoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                      <span className="text-sm">{point}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Course Objectives - Instructors Only */}
            {isInstructor && video.instructorId === user?.uid && (
              <div
                className="animate-fade-in"
                style={{ animationDelay: "0.05s" }}
              >
                <h2 className="mb-6 font-heading text-2xl font-bold">
                  Course Objectives
                </h2>
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    {/* Add New Objective */}
                    <div className="mb-6 flex gap-2">
                      <Input
                        value={newObjective}
                        onChange={(e) => setNewObjective(e.target.value)}
                        placeholder="Add a course objective..."
                        onKeyPress={(e) => {
                          if (e.key === "Enter") handleAddObjective();
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleAddObjective}
                        variant="gradient"
                        size="sm"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </Button>
                    </div>

                    {/* Objectives List */}
                    {objectives.length > 0 ? (
                      <ul className="space-y-2">
                        {objectives.map((objective, index) => (
                          <li
                            key={index}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border/50 p-3 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                              <span className="text-sm">{objective}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteObjective(index)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No objectives added yet. Add your first objective above.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* View Course Objectives - Students Only */}
            {!isInstructor && objectives.length > 0 && (
              <div
                className="animate-fade-in"
                style={{ animationDelay: "0.05s" }}
              >
                <h2 className="mb-6 font-heading text-2xl font-bold">
                  Course Objectives
                </h2>
                <Card className="border-border/50">
                  <CardContent className="p-6">
                    <ul className="space-y-2">
                      {objectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Curriculum */}
            {modules.length > 0 && (
              <div
                className="animate-fade-in"
                style={{ animationDelay: "0.1s" }}
              >
                <h2 className="mb-6 font-heading text-2xl font-bold">
                  Video Curriculum
                </h2>
                <div className="space-y-3">
                  {modules.map((module, index) => (
                    <Card
                      key={module.id || index}
                      className="border-border/50 hover:shadow-md transition-shadow"
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{module.title}</h4>
                            {module.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {module.description}
                              </p>
                            )}
                            {module.duration && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {module.duration}
                              </p>
                            )}
                          </div>
                        </div>
                        <VideoIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Module Management for Instructors */}
            {isInstructor && video.instructorId === user?.uid && (
              <div
                className="animate-fade-in"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-2xl font-bold">
                    Video Modules
                  </h2>
                  <Button
                    onClick={() => setIsAddingModule(true)}
                    className="gradient-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Module
                  </Button>
                </div>

                <div className="space-y-4">
                  {modules.length === 0 ? (
                    <Card className="border-border/50 border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <VideoIcon className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-2">No modules yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Start building your video by adding video modules
                        </p>
                        <Button
                          onClick={() => setIsAddingModule(true)}
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Your First Module
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    modules
                      .sort((a, b) => a.order - b.order)
                      .map((module, index) => (
                        <Card key={module.id} className="border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary flex-shrink-0">
                                  {index + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold truncate">
                                    {module.title}
                                  </h4>
                                  {module.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {module.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    {module.duration && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {module.duration}
                                      </span>
                                    )}
                                    {module.videoUrl && (
                                      <span className="flex items-center gap-1">
                                        <VideoIcon className="h-3 w-3" />
                                        Video uploaded
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingModule(module)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        "Are you sure you want to delete this module?",
                                      )
                                    ) {
                                      deleteModule(module.id);
                                    }
                                  }}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card
              className="border-border/50 animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <CardContent className="p-6">
                <h3 className="mb-4 font-heading font-semibold">
                  About the Instructor
                </h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage
                      src={
                        instructorProfile?.avatarBase64 ||
                        video.instructorAvatar
                      }
                      alt={video.instructor}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {video.instructor.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{video.instructor}</p>
                    <p className="text-sm text-muted-foreground">
                      Expert Instructor
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {instructorProfile?.bio ||
                    "A passionate educator with years of experience helping students achieve their learning goals."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Module Form Dialog */}
      <Dialog
        open={isAddingModule || !!editingModule}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingModule(false);
            setEditingModule(null);
            setModuleForm({
              title: "",
              description: "",
              videoUrl: "",
              duration: "",
            });
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingModule ? "Edit Module" : "Add New Module"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleModuleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="module-title">Module Title *</Label>
              <Input
                id="module-title"
                value={moduleForm.title}
                onChange={(e) =>
                  setModuleForm((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="e.g. Introduction to React Hooks"
                required
              />
            </div>

            <div>
              <Label htmlFor="module-description">Description</Label>
              <Textarea
                id="module-description"
                value={moduleForm.description}
                onChange={(e) =>
                  setModuleForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Brief description of what students will learn..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="module-video">Video URL</Label>
              <Input
                id="module-video"
                type="url"
                value={moduleForm.videoUrl}
                onChange={(e) =>
                  setModuleForm((prev) => ({
                    ...prev,
                    videoUrl: e.target.value,
                  }))
                }
                placeholder="https://example.com/video.mp4 or https://youtube.com/watch?v=..."
              />
              <p className="text-xs text-muted-foreground mt-1">
                Paste a direct video URL or YouTube link. YouTube videos will be
                embedded and playable directly on your website.
              </p>
            </div>

            <div>
              <Label htmlFor="module-duration">Duration</Label>
              <Input
                id="module-duration"
                value={moduleForm.duration}
                onChange={(e) =>
                  setModuleForm((prev) => ({
                    ...prev,
                    duration: e.target.value,
                  }))
                }
                placeholder="e.g. 15 minutes"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddingModule(false);
                  setEditingModule(null);
                  setModuleForm({
                    title: "",
                    description: "",
                    videoUrl: "",
                    duration: "",
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" className="gradient-primary">
                {editingModule ? "Update Module" : "Add Module"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
