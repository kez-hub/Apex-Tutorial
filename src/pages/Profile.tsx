import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  Mail, 
  BookOpen, 
  Clock, 
  Award, 
  Calendar,
  Edit2,
  Settings,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import { courses } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Profile() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, userData } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const userName = user?.displayName || user?.email?.split("@")[0] || "User";
  const userEmail = user?.email || "";
  const defaultAvatar = user?.photoURL || "";
  
  const [avatarUrl, setAvatarUrl] = useState(defaultAvatar);
  
  const handleProfileUpdate = () => {
    setRefreshKey((prev) => prev + 1);
    // Force reload user data
    window.location.reload();
  };
  
  const enrolledCourseIds = userData?.enrolledCourses || [];
  const enrolledCourses = courses.filter((course) => enrolledCourseIds.includes(course.id));
  const totalProgress = enrolledCourses.length > 0 
    ? enrolledCourses.reduce((sum, course) => sum + (course.progress || 0), 0) / enrolledCourses.length 
    : 0;

  const stats = [
    { label: "Courses Enrolled", value: enrolledCourses.length, icon: BookOpen },
    { label: "Hours Learned", value: userData?.hoursLearned || 0, icon: Clock },
    { label: "Certificates", value: 0, icon: Award },
  ];

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarUrl(e.target?.result as string);
        toast({
          title: "Avatar updated! 🎉",
          description: "Your profile picture has been changed.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />

      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8 overflow-hidden border-border/50 shadow-card animate-fade-in">
          <div className="h-32 gradient-primary" />
          <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end">
              <div className="relative -mt-16 group">
                <Avatar className="h-32 w-32 border-4 border-card shadow-elevated cursor-pointer" onClick={handleAvatarClick}>
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback className="text-4xl">{userName.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <button
                  onClick={handleAvatarClick}
                  className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-110"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              
              <div className="flex-1">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="font-heading text-2xl font-bold">{userName}</h1>
                    <div className="mt-1 flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{userEmail}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                      <Edit2 className="h-4 w-4" />
                      Edit Profile
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat, index) => (
                <Card key={stat.label} className="border-border/50 shadow-card animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Enrolled Courses */}
            <Card className="border-border/50 shadow-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Enrolled Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrolledCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50"
                    >
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="h-32 w-full sm:h-16 sm:w-24 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <Link to={`/courses/${course.id}`} className="font-semibold hover:text-primary transition-colors line-clamp-2">
                          {course.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">{course.instructor}</p>
                        <div className="mt-2">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium text-primary">{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-1.5" />
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
                        <Link to={`/courses/${course.id}`}>Continue</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Overall Progress */}
            <Card className="border-border/50 shadow-card animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <CardHeader>
                <CardTitle className="text-lg">Learning Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-center">
                  <div className="relative mx-auto h-32 w-32">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-muted"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${totalProgress * 2.51} 251`}
                        className="text-primary transition-all duration-500"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-heading text-3xl font-bold">{Math.round(totalProgress)}%</span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Keep going! You're making great progress.
                </p>
              </CardContent>
            </Card>

            {/* Learning Schedule */}
            <Card className="border-border/50 shadow-card animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-primary" />
                  Learning Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Set up your learning schedule to receive reminders.</p>
                <Button variant="outline" className="mt-4 w-full" asChild>
                  <Link to="/schedule">Manage Schedule</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />

      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        currentName={userName}
        currentEmail={userEmail}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
}
