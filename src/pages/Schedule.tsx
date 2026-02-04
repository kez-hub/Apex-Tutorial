import { useState, useEffect } from "react";
import { 
  Bell, 
  Plus, 
  Clock, 
  Trash2,
  Power,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { learningAlarms as initialAlarms, courses, LearningAlarm } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Schedule() {
  const { toast } = useToast();
  const [alarms, setAlarms] = useState<LearningAlarm[]>(initialAlarms);
  const [isOpen, setIsOpen] = useState(false);
  const [newAlarm, setNewAlarm] = useState<Partial<LearningAlarm>>({
    time: "09:00",
    days: [],
    enabled: true,
  });

  // Check for due alarms
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const currentDay = DAYS[now.getDay() === 0 ? 6 : now.getDay() - 1];

      alarms.forEach((alarm) => {
        if (alarm.enabled && alarm.time === currentTime && alarm.days.includes(currentDay)) {
          const course = alarm.courseId ? courses.find((c) => c.id === alarm.courseId) : null;
          toast({
            title: "⏰ Time to Learn!",
            description: course 
              ? `It's time to study: ${course.title}`
              : "Your scheduled learning time has arrived!",
          });
        }
      });
    };

    const interval = setInterval(checkAlarms, 60000);
    return () => clearInterval(interval);
  }, [alarms, toast]);

  const handleAddAlarm = () => {
    if (!newAlarm.time || newAlarm.days?.length === 0) {
      toast({
        title: "Invalid alarm",
        description: "Please select a time and at least one day.",
        variant: "destructive",
      });
      return;
    }

    const alarm: LearningAlarm = {
      id: `alarm-${Date.now()}`,
      time: newAlarm.time!,
      days: newAlarm.days!,
      courseId: newAlarm.courseId,
      enabled: true,
    };

    setAlarms([...alarms, alarm]);
    setNewAlarm({ time: "09:00", days: [], enabled: true });
    setIsOpen(false);
    
    toast({
      title: "Reminder set! 🔔",
      description: `You'll be reminded at ${alarm.time} on ${alarm.days.join(", ")}.`,
    });
  };

  const handleDeleteAlarm = (id: string) => {
    setAlarms(alarms.filter((a) => a.id !== id));
    toast({
      title: "Reminder deleted",
      description: "The learning reminder has been removed.",
    });
  };

  const handleToggleAlarm = (id: string) => {
    setAlarms(
      alarms.map((a) =>
        a.id === id ? { ...a, enabled: !a.enabled } : a
      )
    );
  };

  const toggleDay = (day: string) => {
    const days = newAlarm.days || [];
    if (days.includes(day)) {
      setNewAlarm({ ...newAlarm, days: days.filter((d) => d !== day) });
    } else {
      setNewAlarm({ ...newAlarm, days: [...days, day] });
    }
  };

  const getCourseById = (id: string) => courses.find((c) => c.id === id);

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
          <div>
            <h1 className="font-heading text-3xl font-bold">Learning Schedule</h1>
            <p className="mt-2 text-muted-foreground">
              Set reminders to stay consistent with your learning
            </p>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="h-4 w-4" />
                Add Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>New Learning Reminder</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 py-4">
                {/* Time Picker */}
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="time"
                      type="time"
                      value={newAlarm.time}
                      onChange={(e) => setNewAlarm({ ...newAlarm, time: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Days Selector */}
                <div className="space-y-2">
                  <Label>Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox
                          id={day}
                          checked={newAlarm.days?.includes(day)}
                          onCheckedChange={() => toggleDay(day)}
                        />
                        <Label htmlFor={day} className="text-sm cursor-pointer">
                          {day.slice(0, 3)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Course Selector (Optional) */}
                <div className="space-y-2">
                  <Label>Link to Course (Optional)</Label>
                  <Select
                    value={newAlarm.courseId || "none"}
                    onValueChange={(value) => 
                      setNewAlarm({ ...newAlarm, courseId: value === "none" ? undefined : value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific course</SelectItem>
                      {courses.filter(c => c.enrolled).map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button variant="gradient" onClick={handleAddAlarm}>
                  Create Reminder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Alarms List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {alarms.length === 0 ? (
            <Card className="col-span-full border-border/50 border-dashed animate-fade-in">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 rounded-full bg-muted p-6">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-heading text-xl font-semibold">No reminders set</h3>
                <p className="mt-2 text-center text-muted-foreground">
                  Create your first learning reminder to stay on track
                </p>
                <Button variant="gradient" className="mt-4" onClick={() => setIsOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Reminder
                </Button>
              </CardContent>
            </Card>
          ) : (
            alarms.map((alarm, index) => {
              const course = alarm.courseId ? getCourseById(alarm.courseId) : null;
              return (
                <Card 
                  key={alarm.id} 
                  className={`border-border/50 shadow-card transition-all animate-fade-in ${
                    !alarm.enabled ? "opacity-60" : ""
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                          alarm.enabled ? "bg-primary/10" : "bg-muted"
                        }`}>
                          <Bell className={`h-6 w-6 ${alarm.enabled ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-bold">{alarm.time}</CardTitle>
                        </div>
                      </div>
                      <Switch
                        checked={alarm.enabled}
                        onCheckedChange={() => handleToggleAlarm(alarm.id)}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Days */}
                      <div>
                        <p className="mb-2 text-sm text-muted-foreground">Repeats on</p>
                        <div className="flex flex-wrap gap-1">
                          {alarm.days.map((day) => (
                            <Badge 
                              key={day} 
                              variant={alarm.enabled ? "default" : "secondary"}
                              className={alarm.enabled ? "bg-primary/10 text-primary border-primary/20" : ""}
                            >
                              {day.slice(0, 3)}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Linked Course */}
                      {course && (
                        <div className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xs text-muted-foreground">Linked course</p>
                          <p className="mt-1 text-sm font-medium line-clamp-1">{course.title}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleToggleAlarm(alarm.id)}
                        >
                          <Power className="h-4 w-4" />
                          {alarm.enabled ? "Disable" : "Enable"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteAlarm(alarm.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Tips Section */}
        <Card className="mt-8 border-border/50 gradient-primary text-primary-foreground animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-heading font-semibold">Pro Tip</h3>
              <p className="text-sm text-primary-foreground/80">
                Studies show that learning at the same time each day improves retention by up to 30%. 
                Set consistent reminders to build a strong learning habit!
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
