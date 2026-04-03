import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { 
  Bell, 
  Trophy, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  CheckCircle 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch 
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "welcome": return { icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" };
    case "course": return { icon: BookOpen, color: "text-primary", bg: "bg-primary/10" };
    case "streak": return { icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" };
    case "alert": return { icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" };
    default: return { icon: Bell, color: "text-muted-foreground", bg: "bg-muted" };
  }
};

const formatTime = (timestamp: any) => {
  if (!timestamp) return "Just now";
  const date = timestamp.toDate();
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function Notifications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(notifs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadNotifs = notifications.filter(n => !n.isRead);
    
    try {
      const batch = writeBatch(db);
      unreadNotifs.forEach(n => {
        const ref = doc(db, "users", user.uid, "notifications", n.id);
        batch.update(ref, { isRead: true });
      });
      await batch.commit();
      
      toast({
        title: "All caught up!",
        description: "All notifications have been marked as read.",
      });
    } catch (err) {
      console.error("Fail to mark all as read", err);
    }
  };

  const deleteNotification = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "notifications", id));
    } catch (err) {
      console.error("Fail to delete notification", err);
    }
  };

  const clearAll = async () => {
    if (!user || notifications.length === 0) return;
    
    try {
      const batch = writeBatch(db);
      notifications.forEach(n => {
        const ref = doc(db, "users", user.uid, "notifications", n.id);
        batch.delete(ref);
      });
      await batch.commit();

      toast({
        title: "Inbox cleared",
        description: "All notifications have been permanently removed.",
      });
    } catch (err) {
      console.error("Fail to clear all", err);
    }
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={notifications.length === 0}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
            <Button variant="destructive" size="sm" onClick={clearAll} disabled={notifications.length === 0}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading && (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          
          {notifications.map((notification, idx) => {
            const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
            return (
              <Card 
                key={notification.id} 
                className={`animate-fade-in transition-all duration-300 hover:shadow-md ${notification.isRead ? 'opacity-70' : 'border-primary/30 shadow-sm'}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <CardContent className="p-6 flex gap-5">
                  <div className={`mt-1 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${bg}`}>
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg">{notification.title}</h3>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-4">
                        {formatTime(notification.createdAt)}
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
                
                <div className="flex-shrink-0 flex items-center">
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => deleteNotification(notification.id)}
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
              </CardContent>
            </Card>
          );})}

          {notifications.length === 0 && !isLoading && (
            <div className="text-center py-20 animate-fade-in">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <Bell className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold">No notifications</h2>
              <p className="text-muted-foreground">You're all caught up! Check back later for updates.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
