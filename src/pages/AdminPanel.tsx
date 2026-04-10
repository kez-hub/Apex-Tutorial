import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  BookOpen,
  Video,
  FileText,
  TrendingUp,
  Search,
  MoreVertical,
  LogOut,
  Bell,
  Download,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  deleteDoc,
  addDoc,
  setDoc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

interface User {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "instructor";
  hasPaid: boolean;
  createdAt: string;
  isVerified: boolean;
  hoursLearned?: number;
  learningStreak?: number;
  tutorialId?: string;
  verificationCode?: string;
  whatsapp?: string;
  department?: string;
}

interface ContentStats {
  videos: number;
  courses: number;
  quizzes: number;
  notes: number;
}

export default function AdminPanel() {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [contentStats, setContentStats] = useState<ContentStats>({
    videos: 0,
    courses: 0,
    quizzes: 0,
    notes: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "paid" | "unpaid">(
    "all",
  );
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<User>>({});
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [isAnnouncingLoading, setIsAnnouncingLoading] = useState(false);

  const ADMIN_PASSWORD = "12345";

  // Handle opening edit modal
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData(user);
  };

  // Handle saving edited user data
  const handleSaveEdit = async () => {
    if (!editingUser) return;

    try {
      // Only include allowed fields in the update
      const allowedFields = [
        "email",
        "full_name",
        "department",
        "whatsapp",
        "hoursLearned",
        "learningStreak",
        "isVerified",
        "hasPaid",
        "tutorialId",
        "paymentReference",
        "paidAt",
      ];

      const updateData: Record<string, any> = {};
      allowedFields.forEach((field) => {
        if (field in editFormData) {
          updateData[field] = (editFormData as any)[field];
        }
      });

      await updateDoc(doc(db, "users", editingUser.id), updateData);
      setUsers(
        users.map((u) =>
          u.id === editingUser.id ? { ...u, ...updateData } : u,
        ),
      );
      setEditingUser(null);
      setEditFormData({});
      toast({
        title: "Success",
        description: "User data updated successfully.",
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user data.",
        variant: "destructive",
      });
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementContent.trim()) {
      toast({
        title: "Error",
        description: "Please fill in both title and content.",
        variant: "destructive",
      });
      return;
    }

    setIsAnnouncingLoading(true);
    try {
      // Create announcement document
      const announcementRef = await addDoc(collection(db, "announcements"), {
        title: announcementTitle,
        content: announcementContent,
        createdAt: Timestamp.now(),
        createdBy: user?.uid || "admin",
      });

      // Get all paid students
      const paidStudentsQuery = query(
        collection(db, "users"),
        where("hasPaid", "==", true),
        where("role", "==", "student"),
      );
      const studentsSnapshot = await getDocs(paidStudentsQuery);

      // Send notifications to all paid students using batch write
      const batch = writeBatch(db);
      const timestamp = Timestamp.now();

      studentsSnapshot.docs.forEach((studentDoc) => {
        const studentId = studentDoc.id;
        const notificationId = doc(
          collection(db, "users", studentId, "notifications"),
        ).id;
        const notificationRef = doc(
          db,
          "users",
          studentId,
          "notifications",
          notificationId,
        );

        batch.set(notificationRef, {
          type: "announcement",
          title: announcementTitle,
          message: announcementContent,
          announcementId: announcementRef.id,
          isRead: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      });

      await batch.commit();

      setAnnouncementTitle("");
      setAnnouncementContent("");
      toast({
        title: "Success",
        description: `Announcement sent to ${studentsSnapshot.docs.length} paid students.`,
      });
    } catch (error) {
      console.error("Error sending announcement:", error);
      toast({
        title: "Error",
        description: "Failed to send announcement.",
        variant: "destructive",
      });
    } finally {
      setIsAnnouncingLoading(false);
    }
  };

  // Handle password verification
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setShowPasswordForm(false);
      setPasswordInput("");
      toast({
        title: "Welcome",
        description: "You have been authenticated as admin.",
      });
    } else {
      toast({
        title: "Error",
        description: "Incorrect password",
        variant: "destructive",
      });
      setPasswordInput("");
    }
  };

  // Fetch users and content stats
  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchData = async () => {
      try {
        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersList: User[] = [];
        usersSnapshot.forEach((doc) => {
          usersList.push({ id: doc.id, ...doc.data() } as User);
        });
        setUsers(
          usersList.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );

        // Fetch content counts
        const [videosSnap, coursesSnap, quizzesSnap, notesSnap] =
          await Promise.all([
            getDocs(collection(db, "videos")),
            getDocs(collection(db, "courses")),
            getDocs(collection(db, "quizzes")),
            getDocs(collection(db, "notes")),
          ]);

        setContentStats({
          videos: videosSnap.size,
          courses: coursesSnap.size,
          quizzes: quizzesSnap.size,
          notes: notesSnap.size,
        });
      } catch (error) {
        console.error("Error fetching admin data:", error);
        toast({
          title: "Error",
          description: "Failed to load admin data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, toast]);

  const filteredUsers = users.filter(
    (u) =>
      (u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.tutorialId?.toLowerCase().includes(searchTerm.toLowerCase()) ??
          false)) &&
      (paymentFilter === "all" ||
        (paymentFilter === "paid" && u.hasPaid) ||
        (paymentFilter === "unpaid" && !u.hasPaid)),
  );

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      await deleteDoc(doc(db, "users", userId));
      setUsers(users.filter((u) => u.id !== userId));
      toast({
        title: "User deleted",
        description: "User has been successfully removed.",
      });
    } catch (error) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const handleToggleVerification = async (
    userId: string,
    isVerified: boolean,
  ) => {
    try {
      await updateDoc(doc(db, "users", userId), {
        isVerified: !isVerified,
      });
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, isVerified: !isVerified } : u,
        ),
      );
      toast({
        title: "Updated",
        description: `User ${!isVerified ? "verified" : "unverified"}.`,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const { utils, writeFile } = await import("xlsx");

      // Filter students based on current filters
      const studentsToExport = filteredUsers
        .filter((u) => u.role === "student")
        .sort((a, b) => {
          if (a.hasPaid !== b.hasPaid) {
            return a.hasPaid ? -1 : 1;
          }
          const idA = a.tutorialId || "";
          const idB = b.tutorialId || "";
          return idA.localeCompare(idB, undefined, {
            numeric: true,
            sensitivity: "base",
          });
        });

      // Map students data to export format
      const exportData = studentsToExport.map((student, index) => ({
        "S/N": index + 1,
        Name: student.full_name,
        Email: student.email,
        Department: student.department || "N/A",
        WhatsApp: student.whatsapp || "N/A",
        "Tutorial ID": student.tutorialId || "None",
        "Payment Status": student.hasPaid ? "Paid" : "Non-Paid",
        Verified: student.isVerified ? "Yes" : "No",
        "Hours Learned": student.hoursLearned || 0,
        "Learning Streak": student.learningStreak || 0,
        "Date Joined": student.createdAt || "",
      }));

      // Create workbook and worksheet
      const workbook = utils.book_new();
      const worksheet = utils.json_to_sheet(exportData);

      // Set column widths
      const maxWidth = 20;
      const wscols = Array(11)
        .fill(0)
        .map(() => ({ wch: maxWidth }));
      worksheet["!cols"] = wscols;

      utils.book_append_sheet(workbook, worksheet, "Students");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `students-data-${timestamp}.xlsx`;

      // Write Excel file
      writeFile(workbook, filename);

      toast({
        title: "Success",
        description: `Downloaded ${studentsToExport.length} student records.`,
      });
    } catch (error) {
      console.error("Error downloading Excel:", error);
      toast({
        title: "Error",
        description:
          "Failed to download Excel file. Please ensure xlsx library is installed.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar isAuthenticated />

      {/* Password Authentication Form */}
      {!isAuthenticated && (
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto">
            <Card className="border-border/50 shadow-elevated">
              <CardHeader>
                <CardTitle className="text-2xl">Admin Access</CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter the admin password to access the admin panel
                </p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div>
                    <Input
                      type="password"
                      placeholder="Enter admin password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="bg-muted/30"
                      autoFocus
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-accent hover:bg-accent/90"
                  >
                    Access Admin Panel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate("/")}
                  >
                    Back to Home
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      )}

      {/* Admin Panel Content */}
      {isAuthenticated && (
        <main className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="font-heading text-4xl font-bold mb-2">
                Admin Panel
              </h1>
              <p className="text-muted-foreground">
                Manage users, content, and platform statistics.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsAuthenticated(false);
                setShowPasswordForm(true);
              }}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Exit Admin
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  {users.filter((u) => u.role === "student").length} students,{" "}
                  {users.filter((u) => u.role === "instructor").length}{" "}
                  instructors
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  Paid Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter((u) => u.hasPaid).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (users.filter((u) => u.hasPaid).length / users.length) *
                    100
                  ).toFixed(1)}
                  % conversion
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Video className="h-4 w-4 text-purple-500" />
                  Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contentStats.videos}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-500" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contentStats.notes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-red-500" />
                  Quizzes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contentStats.quizzes}</div>
              </CardContent>
            </Card>
          </div>

          {/* Users Management - Tabs */}
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="students" className="gap-2">
                <Users className="h-4 w-4" />
                Students ({users.filter((u) => u.role === "student").length})
              </TabsTrigger>
              <TabsTrigger value="instructors" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Instructors (
                {users.filter((u) => u.role === "instructor").length})
              </TabsTrigger>
              <TabsTrigger value="announcements" className="gap-2">
                <Bell className="h-4 w-4" />
                Announcements
              </TabsTrigger>
            </TabsList>

            {/* Students Tab */}
            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <CardTitle>Students Management</CardTitle>
                    <div className="flex flex-col gap-2 md:gap-3 md:flex-row md:items-center w-full md:w-auto">
                      <Select
                        value={paymentFilter}
                        onValueChange={(val) =>
                          setPaymentFilter(val as "all" | "paid" | "unpaid")
                        }
                      >
                        <SelectTrigger className="w-full md:w-40">
                          <SelectValue placeholder="Filter by payment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Students</SelectItem>
                          <SelectItem value="paid">Paid Students</SelectItem>
                          <SelectItem value="unpaid">
                            Non-Paid Students
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="relative flex-1 md:flex-none md:w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Search students..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Button
                        onClick={handleDownloadExcel}
                        className="w-full md:w-auto gap-2"
                        variant="outline"
                      >
                        <Download className="h-4 w-4" />
                        Export Excel
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>S/N</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>WhatsApp</TableHead>
                            <TableHead>Tutorial ID</TableHead>
                            <TableHead>Payment</TableHead>
                            <TableHead>Verified</TableHead>
                            <TableHead>Hours Learned</TableHead>
                            <TableHead>Streak</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.filter((u) => u.role === "student")
                            .length > 0 ? (
                            filteredUsers
                              .filter((u) => u.role === "student")
                              .sort((a, b) => {
                                // Sort by payment status first (paid first), then by tutorial ID
                                if (a.hasPaid !== b.hasPaid) {
                                  return a.hasPaid ? -1 : 1;
                                }
                                const idA = a.tutorialId || "";
                                const idB = b.tutorialId || "";
                                return idA.localeCompare(idB, undefined, {
                                  numeric: true,
                                  sensitivity: "base",
                                });
                              })
                              .map((user, index) => (
                                <TableRow key={user.id}>
                                  <TableCell className="font-medium">
                                    {index + 1}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {user.full_name}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {user.email}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {user.department || "N/A"}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {user.whatsapp || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {user.tutorialId || "None"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={
                                        user.hasPaid
                                          ? "bg-green-50 text-green-700 border-green-200"
                                          : "bg-gray-50 text-gray-700 border-gray-200"
                                      }
                                    >
                                      {user.hasPaid ? "Paid" : "Free"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={
                                        user.isVerified
                                          ? "bg-green-50 text-green-700 border-green-200"
                                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                      }
                                    >
                                      {user.isVerified ? "Yes" : "No"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-center">
                                    {user.hoursLearned || 0}h
                                  </TableCell>
                                  <TableCell className="text-sm text-center">
                                    {user.learningStreak || 0}
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => handleEditUser(user)}
                                        >
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleToggleVerification(
                                              user.id,
                                              user.isVerified,
                                            )
                                          }
                                        >
                                          {user.isVerified
                                            ? "Unverify"
                                            : "Verify"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleDeleteUser(user.id)
                                          }
                                          className="text-destructive"
                                        >
                                          Delete User
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={9}
                                className="text-center py-8"
                              >
                                No students found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Instructors Tab */}
            <TabsContent value="instructors">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Instructors Management</CardTitle>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search instructors..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading...</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>WhatsApp</TableHead>
                            <TableHead>Verified</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.filter((u) => u.role === "instructor")
                            .length > 0 ? (
                            filteredUsers
                              .filter((u) => u.role === "instructor")
                              .map((user) => (
                                <TableRow key={user.id}>
                                  <TableCell className="font-medium">
                                    {user.full_name}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {user.email}
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {user.whatsapp || "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={
                                        user.isVerified
                                          ? "bg-green-50 text-green-700 border-green-200"
                                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                      }
                                    >
                                      {user.isVerified ? "Yes" : "No"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {new Date(
                                      user.createdAt,
                                    ).toLocaleDateString()}
                                  </TableCell>
                                  <TableCell>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8"
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          onClick={() => handleEditUser(user)}
                                        >
                                          Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleToggleVerification(
                                              user.id,
                                              user.isVerified,
                                            )
                                          }
                                        >
                                          {user.isVerified
                                            ? "Unverify"
                                            : "Verify"}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            handleDeleteUser(user.id)
                                          }
                                          className="text-destructive"
                                        >
                                          Delete User
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center py-8"
                              >
                                No instructors found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Announcements Tab */}
            <TabsContent value="announcements">
              <Card>
                <CardHeader>
                  <CardTitle>Send Announcement to Students</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="announcement-title">Title</Label>
                    <Input
                      id="announcement-title"
                      placeholder="Announcement title"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="announcement-content">Content</Label>
                    <textarea
                      id="announcement-content"
                      placeholder="Announcement content"
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      className="w-full min-h-40 p-3 border border-input rounded-md bg-background text-sm mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleSendAnnouncement}
                    disabled={isAnnouncingLoading}
                    className="w-full bg-accent hover:bg-accent/90"
                  >
                    {isAnnouncingLoading ? "Sending..." : "Send Announcement"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      )}

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                value={editFormData.email || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editFormData.full_name || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    full_name: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-department">Department</Label>
              <Input
                id="edit-department"
                value={editFormData.department || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    department: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-whatsapp">WhatsApp</Label>
              <Input
                id="edit-whatsapp"
                value={editFormData.whatsapp || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, whatsapp: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-hours">Hours Learned</Label>
              <Input
                id="edit-hours"
                type="number"
                value={editFormData.hoursLearned || 0}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    hoursLearned: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-streak">Learning Streak</Label>
              <Input
                id="edit-streak"
                type="number"
                value={editFormData.learningStreak || 0}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    learningStreak: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="edit-tutorialid">Tutorial ID</Label>
              <Input
                id="edit-tutorialid"
                value={editFormData.tutorialId || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    tutorialId: e.target.value,
                  })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="edit-haspaid"
                type="checkbox"
                checked={editFormData.hasPaid || false}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    hasPaid: e.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="edit-haspaid" className="mb-0">
                Has Paid
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
