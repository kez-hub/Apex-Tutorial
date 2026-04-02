import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Clock, 
  Bell, 
  TrendingUp, 
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CourseCard } from "@/components/courses/CourseCard";
import { courses } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";

export default function Dashboard() {
  const { user, userData } = useAuth();
  const userName = user?.displayName || user?.email?.split("@")[0] || "User";
  
  const enrolledCourseIds = userData?.enrolledCourses || [];
  const enrolledCourses = courses.filter((course) => enrolledCourseIds.includes(course.id));
  const upcomingAlarms = userData?.alarms?.filter((alarm) => alarm.enabled) || [];

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

      <main className="container mx-auto px-4 py-8 overflow-hidden">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-3xl font-bold">
            Welcome back, {userName.split(" ")[0]}! 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            Continue your learning journey and achieve your goals.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={stat.title} className="animate-fade-in border-border/50 shadow-card" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="font-heading text-2xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recommended Courses */}
        <section className="mt-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold">Recommended for You</h2>
            <Button variant="ghost" asChild>
              <Link to="/courses" className="text-primary">
                Browse All
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses
              .filter((c) => !c.enrolled)
              .slice(0, 3)
              .map((course, index) => (
                <div key={course.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CourseCard course={course} />
                </div>
              ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
