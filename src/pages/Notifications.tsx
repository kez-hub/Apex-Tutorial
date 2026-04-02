import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Bell, Trophy, BookOpen, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const mockNotifications = [
  {
    id: 1,
    title: "Welcome to Apex Tutorials!",
    message: "Your account is officially verified and your dashboard is ready.",
    time: "2 hours ago",
    icon: Trophy,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    isRead: false,
  },
  {
    id: 2,
    title: "New Course Available",
    message: "A new module for 'Advanced Organic Chemistry' has been uploaded to your department's catalog.",
    time: "1 day ago",
    icon: BookOpen,
    color: "text-primary",
    bg: "bg-primary/10",
    isRead: false,
  },
  {
    id: 3,
    title: "Learning Streak Milestone",
    message: "You've hit a 3-day learning streak! Keep up the great pace.",
    time: "3 days ago",
    icon: CheckCircle2,
    color: "text-green-500",
    bg: "bg-green-500/10",
    isRead: true,
  },
  {
    id: 4,
    title: "System Maintenance",
    message: "Apex Tutorial will undergo a swift 15-minute maintenance window tonight.",
    time: "1 week ago",
    icon: AlertCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    isRead: true,
  }
];

export default function Notifications() {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />
      
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              Notifications
            </h1>
            <p className="text-muted-foreground mt-2">
              Stay updated with your courses and account alerts.
            </p>
          </div>
          <Button variant="outline" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        </div>

        <div className="space-y-4">
          {notifications.map((notification, idx) => (
            <Card 
              key={notification.id} 
              className={`animate-fade-in transition-all duration-300 hover:shadow-md ${notification.isRead ? 'opacity-70' : 'border-primary/30 shadow-sm'}`}
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <CardContent className="p-6 flex gap-5">
                <div className={`mt-1 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${notification.bg}`}>
                  <notification.icon className={`h-6 w-6 ${notification.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg">{notification.title}</h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                      {notification.time}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {notification.message}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="flex-shrink-0 flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary mb-10" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
