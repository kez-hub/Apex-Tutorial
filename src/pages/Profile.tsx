import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  BookOpen,
  Clock,
  Award,
  Calendar,
  Edit2,
  Settings,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { videos } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Profile() {
  const { toast } = useToast();
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const userName =
    userData?.full_name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User";
  const userEmail = user?.email || "";
  const [avatarUrl, setAvatarUrl] = useState(
    userData?.avatarBase64 || user?.photoURL || "",
  );
  const [bannerUrl, setBannerUrl] = useState(userData?.bannerBase64 || "");

  // Certificate logic: Count enrolled videos that are 100% completed
  const enrolledVideoIds = userData?.enrolledVideos || [];
  const enrolledVideos = videos.filter((video) =>
    enrolledVideoIds.includes(video.id),
  );
  const certificatesCount = enrolledVideos.filter(
    (v) => (v.progress || 0) >= 100,
  ).length;
  const totalProgress =
    enrolledVideos.length > 0
      ? enrolledVideos.reduce((sum, video) => sum + (video.progress || 0), 0) /
        enrolledVideos.length
      : 0;

  const stats = [
    {
      label: "Videos Enrolled",
      value: enrolledVideos.length,
      icon: BookOpen,
    },
    { label: "Hours Learned", value: userData?.hoursLearned || 0, icon: Clock },
    { label: "Certificates", value: certificatesCount, icon: Award },
  ];

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file && user) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description:
            "Please select an image under 2MB for storage efficiency.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          // Canvas compression: resize to max 300x300
          const canvas = document.createElement("canvas");
          const MAX_SIZE = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

          try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { avatarBase64: compressedBase64 });
            setAvatarUrl(compressedBase64);
            toast({
              title: "Avatar synced! ☁️",
              description: "Your profile picture is now saved in the database.",
            });
          } catch (err: any) {
            toast({
              title: "Storage Error",
              description: "Failed to save profile picture bits to Firestore.",
              variant: "destructive",
            });
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file && user) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          let width = img.width;
          let height = img.height;

          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.6);

          try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { bannerBase64: compressedBase64 });
            setBannerUrl(compressedBase64);
            toast({
              title: "Banner updated! 🌅",
              description: "Your new cover image has been saved.",
            });
          } catch (err: any) {
            toast({
              title: "Banner Error",
              description: "Failed to save banner bits to Firestore.",
              variant: "destructive",
            });
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />

      <main className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <Card className="mb-8 overflow-hidden border-border/50 shadow-card animate-fade-in relative">
          <div className="h-32 relative overflow-hidden group/banner">
            {bannerUrl ? (
              <img
                src={bannerUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="h-full w-full gradient-primary" />
            )}
            <button
              onClick={() => bannerInputRef.current?.click()}
              className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover/banner:opacity-100 transition-opacity"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerChange}
            />
          </div>
          <CardContent className="relative px-6 pb-6">
            <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end">
              <div className="relative -mt-16 group">
                <Avatar
                  className="h-32 w-32 border-4 border-card shadow-elevated cursor-pointer"
                  onClick={handleAvatarClick}
                >
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback className="text-4xl">
                    {userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
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
                    <h1 className="font-heading text-2xl font-bold">
                      {userName}
                    </h1>
                    {userData?.role === "instructor" && userData?.bio && (
                      <p className="mt-2 text-sm text-muted-foreground max-w-md">
                        {userData.bio}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{userEmail}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/profile/edit")}
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit Profile
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/settings")}
                    >
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
                <Card
                  key={stat.label}
                  className="border-border/50 shadow-card animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <stat.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading text-2xl font-bold">
                        {stat.value}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stat.label}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Enrolled Videos */}
            <Card
              className="border-border/50 shadow-card animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Enrolled Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrolledVideos.map((video) => (
                    <div
                      key={video.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50"
                    >
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="h-32 w-full sm:h-16 sm:w-24 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/videos/${video.id}`}
                          className="font-semibold hover:text-primary transition-colors line-clamp-2"
                        >
                          {video.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          {video.instructor}
                        </p>
                        <div className="mt-2">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              Progress
                            </span>
                            <span className="font-medium text-primary">
                              {video.progress}%
                            </span>
                          </div>
                          <Progress value={video.progress} className="h-1.5" />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto"
                        asChild
                      >
                        <Link to={`/videos/${video.id}`}>Continue</Link>
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
            <Card
              className="border-border/50 shadow-card animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <CardHeader>
                <CardTitle className="text-lg">Learning Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-center">
                  <div className="relative mx-auto h-32 w-32">
                    <svg
                      className="h-full w-full -rotate-90"
                      viewBox="0 0 100 100"
                    >
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
                      <span className="font-heading text-3xl font-bold">
                        {Math.round(totalProgress)}%
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-center text-sm text-muted-foreground">
                  Keep going! You're making great progress.
                </p>
              </CardContent>
            </Card>

            {/* Learning Schedule */}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
