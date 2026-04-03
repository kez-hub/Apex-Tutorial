import { Link } from "react-router-dom";
import { Clock, BookOpen, Star, Users } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Course } from "@/lib/data";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const { userData } = useAuth();
  const { toast } = useToast();

  const handleCourseClick = (e: React.MouseEvent) => {
    // Instructors bypass the payment check
    if (userData?.role === 'instructor') return;

    if (!userData?.hasPaid && !course.enrolled) {
      e.preventDefault();
      toast({
        title: "Payment Required ₦",
        description: "You need to unlock all courses to access this content. Check your dashboard for the 'Pay Now' button.",
        variant: "destructive",
      });
    }
  };

  const levelColors = {
    Beginner: "bg-accent/10 text-accent border-accent/20",
    Intermediate: "bg-secondary/10 text-secondary border-secondary/20",
    Advanced: "bg-primary/10 text-primary border-primary/20",
  };

  return (
    <Link to={`/courses/${course.id}`} onClick={handleCourseClick}>
      <Card className="group h-full overflow-hidden border-border/50 bg-card shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          <Badge
            className={`absolute left-3 top-3 ${levelColors[course.level as keyof typeof levelColors]}`}
            variant="outline"
          >
            {course.level}
          </Badge>
          {course.enrolled && (
            <Badge className="absolute right-3 top-3 bg-accent text-accent-foreground">
              Enrolled
            </Badge>
          )}
        </div>

        <CardContent className="p-4">
          {/* Category */}
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-primary">
            {course.category}
          </p>

          {/* Title */}
          <h3 className="mb-3 font-heading text-lg font-semibold leading-tight text-foreground line-clamp-2 group-hover:text-primary transition-colors">
            {course.title}
          </h3>

          {/* Instructor */}
          <div className="mb-3 flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={course.instructorAvatar} alt={course.instructor} />
              <AvatarFallback>{course.instructor.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{course.instructor}</span>
          </div>

          {/* Stats */}
          <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              <span>{course.lessons} lessons</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-medium">{course.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span className="text-xs">{course.students.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>

        {/* Progress (if enrolled) */}
        {course.enrolled && course.progress !== undefined && (
          <CardFooter className="border-t border-border/50 bg-muted/30 px-4 py-3">
            <div className="w-full">
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-primary">{course.progress}%</span>
              </div>
              <Progress value={course.progress} className="h-1.5" />
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
