import { Link } from "react-router-dom";
import {
  Clock,
  BookOpen,
  Star,
  Users,
  MoreVertical,
  Pencil,
  Trash,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Video } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { doc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface VideoCardProps {
  video: Video;
  onEdit?: (video: Video) => void;
}

export function VideoCard({ video, onEdit }: VideoCardProps) {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [instructorAvatar, setInstructorAvatar] = useState(
    video.instructorAvatar,
  );

  // Fetch instructor profile picture from Firestore
  useEffect(() => {
    if (video.instructorId) {
      getDoc(doc(db, "users", video.instructorId))
        .then((docSnap) => {
          if (docSnap.exists()) {
            const instructorData = docSnap.data();
            if (instructorData.avatarBase64) {
              setInstructorAvatar(instructorData.avatarBase64);
            }
          }
        })
        .catch((error) => {
          console.error("Error fetching instructor avatar:", error);
        });
    }
  }, [video.instructorId]);

  const handleVideoClick = (e: React.MouseEvent) => {
    // Instructors bypass the payment check
    if (userData?.role === "instructor") return;

    if (!userData?.hasPaid && !video.enrolled) {
      e.preventDefault();
      toast({
        title: "Payment Required ₦",
        description:
          "You need to unlock all videos to access this content. Check your dashboard for the 'Pay Now' button.",
        variant: "destructive",
      });
    }
  };

  const isOwner =
    userData?.role === "instructor" && video.instructorId === user?.uid;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !window.confirm(
        "Are you sure you want to delete this video? This action cannot be undone.",
      )
    )
      return;

    try {
      await deleteDoc(doc(db, "videos", video.id));
      toast({
        title: "Video Deleted",
        description:
          "The video has been successfully removed from the platform.",
      });
    } catch (err) {
      console.error("Error deleting video:", err);
      toast({
        title: "Deletion Failed",
        description: "You don't have permission to delete this video.",
        variant: "destructive",
      });
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) onEdit(video);
  };

  const levelColors = {
    Beginner: "bg-accent/10 text-accent border-accent/20",
    Intermediate: "bg-secondary/10 text-secondary border-secondary/20",
    Advanced: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <Link to={`/videos/${video.id}`} onClick={handleVideoClick}>
      <Card className="group h-full overflow-hidden border-border/50 bg-card shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <Badge
            className={`absolute left-3 top-3 ${levelColors[video.level as keyof typeof levelColors]}`}
            variant="outline"
          >
            {video.level}
          </Badge>
          {video.enrolled && (
            <Badge className="absolute right-3 top-3 bg-accent text-accent-foreground">
              Enrolled
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          {/* Category */}
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">
            {video.category}
          </p>

          {/* Title */}
          <h3 className="mb-3 font-heading text-lg font-semibold leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {video.title}
          </h3>

          {/* Instructor */}
          <div className="mb-3 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage
                src={instructorAvatar}
                alt={video.instructor}
                className="object-cover"
              />
              <AvatarFallback>{video.instructor.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              {video.instructor}
            </span>
          </div>

          {/* Stats */}
          <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{video.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{video.lessons} lessons</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium">{video.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="text-xs">
                  {video.students.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Instructor Management Menu - Relocated to Bottom Right */}
            {isOwner && (
              <div onClick={(e) => e.preventDefault()}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-muted"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem
                      onClick={handleEditClick}
                      className="cursor-pointer gap-2"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                    >
                      <Trash className="h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>

        {/* Progress (if enrolled) */}
        {video.enrolled && video.progress !== undefined && (
          <CardFooter className="border-t border-border/50 bg-muted/30 px-4 py-3">
            <div className="w-full">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-primary">
                  {video.progress}%
                </span>
              </div>
              <Progress value={video.progress} className="h-1.5" />
            </div>
          </CardFooter>
        )}

        {/* Message Icon for Students */}
        {userData?.role === "student" &&
          userData?.enrolledCourses?.includes(video.id) && (
            <div className="absolute bottom-3 right-3">
              <Button
                variant="secondary"
                size="icon"
                className="h-8 w-8 rounded-full shadow-md hover:shadow-lg transition-shadow bg-background/90 backdrop-blur-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Navigate to messages with instructor
                  window.location.href = `/messages?instructor=${video.instructorId}`;
                }}
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          )}
      </Card>
    </Link>
  );
}
