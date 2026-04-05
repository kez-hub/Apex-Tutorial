import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Phone,
  BookOpen,
  Save,
  ArrowLeft,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

const departments = [
  "Biological Science(s)",
  "Biochemistry",
  "Microbiology",
  "Pure and Industrial Chemistry",
  "Faculty of Physical Sciences",
  "Computer Science",
  "Geology",
  "Mathematics",
  "Industrial Physics",
  "Physics",
  "Statistics",
  "Nursing Science",
  "Medical Laboratory Science",
  "Anatomy",
  "Physiology",
  "Medicine and Surgery",
  "Faculty of Engineering",
  "Civil Engineering",
  "Electrical/Electronic Engineering",
  "Mechanical Engineering",
  "Agricultural Economics and Extension",
  "Animal Science",
  "Crop Science And Horticulture",
  "Soil Science",
  "Fishery & Aquaculture",
  "Food Science & Technology",
];

export default function EditProfile() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    if (userData) {
      setName(userData.full_name || "");
      setDepartment(userData.department || "");
      setWhatsapp(userData.whatsapp || "");
      setBio(userData.bio || "");
    }
  }, [userData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        full_name: name.trim(),
        department: department,
        whatsapp: whatsapp.trim(),
        bio: bio.trim(),
      });

      toast({
        title: "Profile updated! 🎉",
        description: "Your changes have been saved successfully.",
      });
      navigate("/profile");
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

        <Card className="border-border/50 shadow-card animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl font-heading">
              Edit Your Profile
            </CardTitle>
            <CardDescription>
              Update your personal information and academic details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    value={user?.email || ""}
                    disabled
                    className="pl-10 bg-muted cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Email changes are restricted for security.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Academic Department</Label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-50" />
                  <Input
                    id="department"
                    value={department}
                    disabled
                    className="pl-10 bg-muted cursor-not-allowed opacity-70"
                  />
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Your department is locked to your account record.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-50" />
                  <Input
                    id="whatsapp"
                    value={whatsapp}
                    disabled
                    className="pl-10 bg-muted cursor-not-allowed opacity-70"
                    placeholder="Not set"
                  />
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Phone numbers cannot be changed here for security.
                </p>
              </div>

              {userData?.role === "instructor" && (
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-50" />
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="pl-10 min-h-[100px] resize-none"
                      placeholder="Tell students about your experience, teaching style, and what makes you passionate about your subject..."
                      maxLength={500}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {bio.length}/500 characters
                  </p>
                </div>
              )}

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="gradient"
                  className="w-full h-12"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Updating...
                    </span>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
