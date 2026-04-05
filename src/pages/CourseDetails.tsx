import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Clock,
  BookOpen,
  Star,
  Users,
  PlayCircle,
  CheckCircle,
  BarChart,
  Award,
  ArrowLeft,
  Lock,
  Plus,
  Upload,
  Edit,
  Trash2,
  Video,
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
import { Course, CourseModule } from "@/lib/data";
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

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [instructorProfile, setInstructorProfile] = useState<any>(null);
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    duration: "",
  });

  useEffect(() => {
    if (!id) return;

    const courseDoc = doc(db, "courses", id);
    const unsubscribe = onSnapshot(
      courseDoc,
      (snapshot) => {
        if (snapshot.exists()) {
          const courseData = { ...snapshot.data(), id: snapshot.id } as Course;
          setCourse(courseData);
          setModules(courseData.modules || []);

          // Fetch instructor profile if instructorId exists
          if (courseData.instructorId) {
            const instructorDoc = doc(db, "users", courseData.instructorId);
            getDoc(instructorDoc).then((instructorSnapshot) => {
              if (instructorSnapshot.exists()) {
                setInstructorProfile(instructorSnapshot.data());
              }
            }).catch((error) => {
              console.error("Error fetching instructor profile:", error);
            });
          }
        } else {
          setCourse(null);
          setModules([]);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error loading course:", error);
        setCourse(null);
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
    moduleData: Omit<CourseModule, "id" | "order" | "createdAt">,
  ) => {
    if (!course || !id) return;

    const newModule: CourseModule = {
      ...moduleData,
      id: `module-${Date.now()}`,
      order: modules.length,
      createdAt: new Date().toISOString(),
    };

    const updatedModules = [...modules, newModule];

    try {
      await updateDoc(doc(db, "courses", id), {
        modules: updatedModules,
        lessons: updatedModules.length,
      });
      setModules(updatedModules);
      toast({
        title: "Module Added",
        description: "Your video module has been added to the course.",
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
    updates: Partial<CourseModule>,
  ) => {
    if (!course || !id) return;

    const updatedModules = modules.map((module) =>
      module.id === moduleId ? { ...module, ...updates } : module,
    );

    try {
      await updateDoc(doc(db, "courses", id), {
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
    if (!course || !id) return;

    const updatedModules = modules.filter((module) => module.id !== moduleId);

    try {
      await updateDoc(doc(db, "courses", id), {
        modules: updatedModules,
        lessons: updatedModules.length,
      });
      setModules(updatedModules);
      toast({
        title: "Module Deleted",
        description: "The module has been removed from your course.",
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

  const isEnrolled = !!(
    course?.enrolled || userData?.enrolledCourses?.includes(id || "")
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar isAuthenticated />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="font-heading text-2xl font-bold">Course not found</h1>
          <p className="mt-2 text-muted-foreground">
            The course you're looking for doesn't exist.
          </p>
          <Button asChild className="mt-4">
            <Link to="/courses">Back to Courses</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const handleEnroll = async () => {
    if (!user || !userData || !course || !id) return;

    try {
      // Update user's enrolled courses
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, {
        enrolledCourses: arrayUnion(id),
      });

      // Increment course student count
      const courseDocRef = doc(db, "courses", id);
      await updateDoc(courseDocRef, {
        students: increment(1),
      });

      // Update local state
      setCourse(prev => prev ? { ...prev, students: prev.students + 1 } : null);

      toast({
        title: "Enrolled successfully! 🎉",
        description: `You're now enrolled in "${course.title}"`,
      });
    } catch (error) {
      console.error("Error enrolling in course:", error);
      toast({
        title: "Enrollment failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const learningPoints = [
    "Build real-world projects from scratch",
    "Understand core concepts and best practices",
    "Get lifetime access to course materials",
    "Earn a certificate upon completion",
    "Access to exclusive community",
    "Regular updates with new content",
  ];

  const curriculum = [
    { title: "Introduction & Setup", lessons: 8, duration: "1h 30m" },
    { title: "Core Concepts", lessons: 15, duration: "4h 15m" },
    { title: "Advanced Techniques", lessons: 20, duration: "6h 45m" },
    { title: "Real-World Projects", lessons: 12, duration: "8h 30m" },
    { title: "Best Practices & Tips", lessons: 10, duration: "3h 20m" },
  ];

  // Check if user has paid (Instructors bypass)
  const isInstructor = userData?.role === "instructor";
  if (
    user &&
    userData &&
    !userData.hasPaid &&
    !course.enrolled &&
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

          <h1 className="text-3xl font-bold font-heading mb-4">
            Course Locked
          </h1>
          <p className="text-muted-foreground max-w-md mb-8">
            You need to make a one-time payment to unlock access to "
            {course.title}" and all other premium courses on Apex Tutorials.
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
              <Link to="/courses">Browse Other Courses</Link>
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
            <Link to="/courses">
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Link>
          </Button>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Course Info */}
            <div className="lg:col-span-2 animate-fade-in">
              <Badge variant="outline" className="mb-4">
                {course.category}
              </Badge>
              <h1 className="mb-4 font-heading text-3xl font-bold md:text-4xl">
                {course.title}
              </h1>
              <p className="mb-6 text-lg text-muted-foreground">
                {course.description}
              </p>

              {/* Stats */}
              <div className="mb-6 flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-1">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="font-semibold">{course.rating}</span>
                  <span className="text-muted-foreground">rating</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{course.students.toLocaleString()} students</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <BookOpen className="h-4 w-4" />
                  <span>{course.lessons} lessons</span>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  {course.level}
                </Badge>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={course.instructorAvatar}
                    alt={course.instructor}
                  />
                  <AvatarFallback>{course.instructor.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm text-muted-foreground">Instructor</p>
                  <p className="font-semibold">{course.instructor}</p>
                </div>
              </div>
            </div>

            {/* Enrollment Card */}
            <div className="animate-slide-in-right">
              <Card className="sticky top-24 overflow-hidden border-border/50 shadow-elevated max-w-full">
                {isEnrolled ? (
                  <VideoPlayer
                    src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                    poster={course.thumbnail}
                    title={`Lesson 1: Introduction to ${course.title}`}
                  />
                ) : (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  {isEnrolled ? (
                    <>
                      {course.progress !== undefined && (
                        <div className="mb-6">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Your Progress
                            </span>
                            <span className="font-semibold text-primary">
                              {course.progress}%
                            </span>
                          </div>
                          <Progress value={course.progress} className="h-3" />
                        </div>
                      )}
                      <Button
                        variant="gradient"
                        className="w-full"
                        size="lg"
                        onClick={() => {
                          const videoEl = document.querySelector("video");
                          if (videoEl) {
                            videoEl.scrollIntoView({
                              behavior: "smooth",
                              block: "center",
                            });
                            videoEl.play();
                          }
                        }}
                      >
                        <PlayCircle className="h-5 w-5" />
                        Continue Learning
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="gradient"
                      className="w-full"
                      size="lg"
                      onClick={handleEnroll}
                    >
                      Enroll Now
                    </Button>
                  )}

                  <Separator className="my-6" />

                  <div className="space-y-3">
                    <h4 className="font-semibold">This course includes:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <PlayCircle className="h-4 w-4" />
                        <span>{course.duration} on-demand video</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.lessons} lessons</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <BarChart className="h-4 w-4" />
                        <span>Downloadable resources</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Award className="h-4 w-4" />
                        <span>Certificate of completion</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
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

            {/* Curriculum */}
            <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <h2 className="mb-6 font-heading text-2xl font-bold">
                Course Curriculum
              </h2>
              <div className="space-y-3">
                {curriculum.map((section, index) => (
                  <Card key={index} className="border-border/50">
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 font-semibold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold">{section.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {section.lessons} lessons • {section.duration}
                          </p>
                        </div>
                      </div>
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Module Management for Instructors */}
            {isInstructor && course.instructorId === user?.uid && (
              <div
                className="animate-fade-in"
                style={{ animationDelay: "0.2s" }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-heading text-2xl font-bold">
                    Course Modules
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
                        <Video className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="font-semibold mb-2">No modules yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Start building your course by adding video modules
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
                                        <Video className="h-3 w-3" />
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
                      src={instructorProfile?.avatarBase64 || course.instructorAvatar}
                      alt={course.instructor}
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {course.instructor.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{course.instructor}</p>
                    <p className="text-sm text-muted-foreground">
                      Expert Instructor
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {instructorProfile?.bio || "A passionate educator with years of experience helping students achieve their learning goals."}
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
                placeholder="https://example.com/video.mp4"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Upload your video to a hosting service and paste the URL here
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
