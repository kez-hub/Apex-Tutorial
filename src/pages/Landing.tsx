import { Link } from "react-router-dom";
import { ArrowRight, Play, BookOpen, Users, Award, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CourseCard } from "@/components/courses/CourseCard";
import { courses } from "@/lib/data";

export default function Landing() {
  const featuredCourses = courses.slice(0, 3);

  const stats = [
    { icon: BookOpen, value: "500+", label: "Courses" },
    { icon: Users, value: "50K+", label: "Students" },
    { icon: Award, value: "100+", label: "Instructors" },
  ];

  const features = [
    "Learn at your own pace with lifetime access",
    "Get certificates upon course completion",
    "Access on mobile, tablet, and desktop",
    "Join a community of learners worldwide",
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -right-40 top-40 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
        </div>
        
        <div className="container relative mx-auto px-4 py-20 lg:py-32">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                New courses added weekly
              </div>
              
              <h1 className="font-heading text-4xl font-bold leading-tight text-foreground md:text-5xl lg:text-6xl">
                Unlock Your
                <span className="text-gradient"> Learning </span>
                Potential
              </h1>
              
              <p className="max-w-lg text-lg text-muted-foreground">
                Join thousands of learners mastering new skills with our expert-led courses. 
                Start your journey today and transform your future.
              </p>
              
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button variant="gradient" size="xl" asChild>
                  <Link to="/auth?mode=signup">
                    Get Started Free
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" className="gap-2">
                  <Play className="h-5 w-5 fill-primary text-primary" />
                  Watch Demo
                </Button>
              </div>
              
              <div className="flex items-center gap-6 pt-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <stat.icon className="h-5 w-5 text-primary" />
                      <span className="font-heading text-2xl font-bold">{stat.value}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative hidden lg:block animate-slide-in-right">
              <div className="relative aspect-square overflow-hidden rounded-2xl shadow-elevated">
                <img
                  src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=800&fit=crop"
                  alt="Students learning"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
              </div>
              
              {/* Floating cards */}
              <div className="absolute -left-8 bottom-8 rounded-xl bg-card p-4 shadow-elevated animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                    <Award className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold">Certified</p>
                    <p className="text-sm text-muted-foreground">Get recognized</p>
                  </div>
                </div>
              </div>
              
              <div className="absolute -right-8 top-8 rounded-xl bg-card p-4 shadow-elevated animate-fade-in" style={{ animationDelay: "0.5s" }}>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=40&h=40&fit=crop" className="h-8 w-8 rounded-full border-2 border-card" alt="" />
                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop" className="h-8 w-8 rounded-full border-2 border-card" alt="" />
                    <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop" className="h-8 w-8 rounded-full border-2 border-card" alt="" />
                  </div>
                  <div>
                    <p className="font-heading font-semibold">50K+</p>
                    <p className="text-sm text-muted-foreground">Active learners</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-y border-border bg-card py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent" />
                <p className="text-muted-foreground">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 font-heading text-3xl font-bold md:text-4xl">
              Featured Courses
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground">
              Explore our most popular courses taught by industry experts and start learning today.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredCourses.map((course, index) => (
              <div key={course.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CourseCard course={course} />
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/courses">
                View All Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 gradient-primary opacity-95" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-white blur-3xl" />
        </div>
        
        <div className="container relative mx-auto px-4 text-center">
          <h2 className="mb-4 font-heading text-3xl font-bold text-primary-foreground md:text-4xl">
            Ready to Start Learning?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-primary-foreground/80">
            Join our community of learners and get access to hundreds of courses taught by experts.
          </p>
          <Button size="xl" className="bg-background text-foreground hover:bg-background/90" asChild>
            <Link to="/auth?mode=signup">
              Create Free Account
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
