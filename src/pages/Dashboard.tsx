import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Clock, 
  Bell, 
  TrendingUp, 
  Calendar,
  ArrowRight,
  PlayCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CourseCard } from "@/components/courses/CourseCard";
import { courses, currentUser, learningAlarms } from "@/lib/data";

export default function Dashboard() {
  const enrolledCourses = courses.filter((course) => course.enrolled);
  const upcomingAlarms = learningAlarms.filter((alarm) => alarm.enabled);

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
      value: "48",
      icon: Clock,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Learning Streak",
      value: "12 days",
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

  const getCourseById = (id: string) => courses.find((c) => c.id === id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 animate-fade-in">
          <h1 className="font-heading text-3xl font-bold">
            Welcome back, {currentUser.name.split(" ")[0]}! 👋
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

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Continue Learning */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold">Continue Learning</h2>
              <Button variant="ghost" asChild>
                <Link to="/courses" className="text-primary">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {enrolledCourses.map((course, index) => (
                <Card 
                  key={course.id} 
                  className="group overflow-hidden border-border/50 shadow-card transition-all hover:shadow-elevated animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="flex gap-4 p-4">
                    <div className="relative aspect-video w-40 flex-shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/20">
                        <PlayCircle className="h-10 w-10 text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <Badge variant="outline" className="mb-2 text-xs">
                          {course.category}
                        </Badge>
                        <h3 className="font-heading font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {course.instructor}
                        </p>
                      </div>
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-primary">{course.progress}%</span>
                        </div>
                        <Progress value={course.progress} className="h-2" />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Button variant="gradient" size="sm" asChild>
                        <Link to={`/courses/${course.id}`}>Continue</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Learning Schedule */}
            <Card className="border-border/50 shadow-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingAlarms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reminders set</p>
                ) : (
                  upcomingAlarms.map((alarm) => {
                    const course = alarm.courseId ? getCourseById(alarm.courseId) : null;
                    return (
                      <div
                        key={alarm.id}
                        className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <Bell className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {alarm.time}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {alarm.days.join(", ")}
                          </p>
                          {course && (
                            <p className="mt-1 text-xs text-primary line-clamp-1">
                              {course.title}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/schedule">
                    Manage Schedule
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card className="border-border/50 shadow-card gradient-primary text-primary-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h3 className="font-heading text-lg font-semibold">Keep it up! 🎉</h3>
                  <p className="mt-1 text-sm text-primary-foreground/80">
                    You're on a 12-day learning streak!
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Weekly Goal</span>
                    <span className="font-medium">5/7 days</span>
                  </div>
                  <Progress value={71} className="h-2 bg-primary-foreground/20" />
                </div>
              </CardContent>
            </Card>
          </div>
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
