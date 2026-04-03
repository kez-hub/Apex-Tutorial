import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Settings as SettingsIcon, 
  Bell, 
  Lock, 
  Trash2, 
  Shield, 
  ChevronRight,
  ArrowLeft,
  Moon,
  Sun
} from "lucide-react";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [courseUpdates, setCourseUpdates] = useState(true);
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"));

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    try {
      await deleteDoc(doc(db, "users", user.uid));
      await user.delete();
      toast({
        title: "Account Deleted",
        description: "Your account and data have been wiped. Redirecting...",
      });
      await signOut();
      navigate("/");
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
         toast({
          title: "Security Timeout",
          description: "To delete your account, please log out and log back in to verify your identity.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Deletion Failed",
          description: error.message || "An error occurred while deleting your account.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />
      
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <Button 
          variant="ghost" 
          className="mb-6 gap-2" 
          onClick={() => navigate("/profile")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Button>

        <h1 className="text-3xl font-bold font-heading mb-8 flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Account Settings
        </h1>

        <div className="space-y-6">
          {/* Notifications Card */}
          <Card className="border-border/50 shadow-card animate-fade-in">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>Manage how you receive alerts and updates.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground italic">Receive course alerts.</p>
                </div>
                <Switch 
                  checked={emailNotifications} 
                  onCheckedChange={setEmailNotifications} 
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Course Progress Alerts</Label>
                  <p className="text-sm text-muted-foreground italic">Get notified when you hit milestones.</p>
                </div>
                <Switch 
                  checked={courseUpdates} 
                  onCheckedChange={setCourseUpdates} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Appearance Card */}
          <Card className="border-border/50 shadow-card animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                {isDark ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
                Appearance
              </CardTitle>
              <CardDescription>Customize the look and feel of your dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground italic">Switch between light and dark themes.</p>
                </div>
                <Switch 
                  checked={isDark} 
                  onCheckedChange={setIsDark} 
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card className="border-border/50 shadow-card animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security
              </CardTitle>
              <CardDescription>Manage your account credentials.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between cursor-pointer group">
                <div className="space-y-0.5">
                  <Label className="text-base cursor-pointer group-hover:text-primary transition-colors">Change Password</Label>
                  <p className="text-sm text-muted-foreground italic">Update your security key.</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/20 bg-destructive/5 shadow-card animate-fade-in border-dashed" style={{ animationDelay: "0.3s" }}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2 text-destructive">
                <Trash2 className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Permanent account actions.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground italic">
                  Deleting your account will permanently strip all enrolled course data and learning streaks.
                </p>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="default"
                      className="whitespace-nowrap"
                    >
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account,
                        your academic records, and all data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteAccount}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
