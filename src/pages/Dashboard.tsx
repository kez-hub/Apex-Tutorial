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
  Video,
  ClipboardList,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CourseCard } from "@/components/courses/CourseCard";
import { courses as initialCourses, Course } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/hooks/useCourses";
import { AddCourseModal } from "@/components/courses/AddCourseModal";

export default function Dashboard() {
  const { user, userData } = useAuth();
  const { courses, loading } = useCourses();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const navigate = useNavigate();
  const userName = user?.displayName || user?.email?.split("@")[0] || "User";

  const enrolledCourseIds = userData?.enrolledCourses || [];
  const enrolledCourses = courses.filter((course) =>
    enrolledCourseIds.includes(course.id),
  );
  const upcomingAlarms =
    userData?.alarms?.filter((alarm) => alarm.enabled) || [];

  const filteredDashboardCourses = courses
    .filter((c) => !enrolledCourseIds.includes(c.id))
    .slice(0, 6);

  const stats = [
    {
      title: "Courses Enrolled",
      value: enrolledCourses.length,
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

      <AddCourseModal
        isOpen={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) setCourseToEdit(null);
        }}
        initialData={courseToEdit}
      />

      <main className="container mx-auto px-4 py-8 overflow-hidden">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-3xl font-bold">
            Welcome back, {userName.split(" ")[0]}! 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            {userData?.role === "instructor"
              ? "Manage your courses and inspire your students."
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

        {/* Recommended Courses */}
        <section className="mt-12 pb-20">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold">
              {userData?.role === "instructor"
                ? "Courses"
                : "Recommended for You"}
            </h2>
            <Button variant="ghost" asChild>
              <Link to="/courses" className="text-primary">
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
            ) : filteredDashboardCourses.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border/50 rounded-2xl bg-muted/30">
                <div className="mb-4 rounded-full bg-background p-4 shadow-sm">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-heading text-xl font-semibold">
                  No course is available
                </h3>
                <p className="mt-2 text-muted-foreground max-w-xs">
                  Check back later or click "Browse All" to see the full
                  catalog.
                </p>
              </div>
            ) : (
              filteredDashboardCourses.map((course, index) => (
                <div
                  key={course.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CourseCard
                    course={course}
                    onEdit={(c) => {
                      setCourseToEdit(c);
                      setIsAddModalOpen(true);
                    }}
                  />
                </div>
              ))
            )}
          </div>
        </section>

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
                    Course Quizzes
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Unlock quizzes by completing course modules
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
                  <Video className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Videos</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFabOpen(false);
                    navigate("/quiz");
                  }}
                  className="flex items-center gap-3 rounded-full bg-white/95 px-4 py-3 shadow-xl shadow-black/10 ring-1 ring-border transition hover:-translate-y-1"
                  title="Quiz"
                >
                  <ClipboardList className="h-5 w-5 text-secondary" />
                  <span className="text-sm font-medium">Quiz</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFabOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-full bg-white/95 px-4 py-3 shadow-xl shadow-black/10 ring-1 ring-border transition hover:-translate-y-1"
                  title="Notes"
                >
                  <FileText className="h-5 w-5 text-accent" />
                  <span className="text-sm font-medium">Notes</span>
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
