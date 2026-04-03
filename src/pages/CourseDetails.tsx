import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { courses } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

export default function CourseDetails() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const course = courses.find((c) => c.id === id);
  const [isEnrolled, setIsEnrolled] = useState(course?.enrolled || false);

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

  const handleEnroll = () => {
    setIsEnrolled(true);
    toast({
      title: "Enrolled successfully! 🎉",
      description: `You're now enrolled in "${course.title}"`,
    });
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
                  <AvatarImage src={course.instructorAvatar} alt={course.instructor} />
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
                              <span className="text-muted-foreground">Your Progress</span>
                              <span className="font-semibold text-primary">{course.progress}%</span>
                            </div>
                            <Progress value={course.progress} className="h-3" />
                          </div>
                        )}
                        <Button 
                          variant="gradient" 
                          className="w-full" 
                          size="lg"
                          onClick={() => {
                            const videoEl = document.querySelector('video');
                            if (videoEl) {
                              videoEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
              <h2 className="mb-6 font-heading text-2xl font-bold">What You'll Learn</h2>
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
              <h2 className="mb-6 font-heading text-2xl font-bold">Course Curriculum</h2>
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
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <Card className="border-border/50 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardContent className="p-6">
                <h3 className="mb-4 font-heading font-semibold">About the Instructor</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={course.instructorAvatar} alt={course.instructor} />
                    <AvatarFallback>{course.instructor.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{course.instructor}</p>
                    <p className="text-sm text-muted-foreground">Expert Instructor</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  A passionate educator with years of experience helping students achieve their learning goals.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
