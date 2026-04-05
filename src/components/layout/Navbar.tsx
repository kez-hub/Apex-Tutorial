import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { BookOpen, Menu, X, User, Bell, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface NavbarProps {
  isAuthenticated?: boolean;
}

export function Navbar({ isAuthenticated = false }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userData, signOut } = useAuth();
  const isAuthed = !!user;

  const userName =
    userData?.full_name ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "User";
  const userEmail = user?.email || "";
  const userAvatar = userData?.avatarBase64 || user?.photoURL || "";

  useEffect(() => {
    if (!user) return;

    const notificationsRef = collection(db, "users", user.uid, "notifications");
    const q = query(notificationsRef, where("isRead", "==", false));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadNotifications(snapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const navLinks = isAuthed
    ? ([
        { href: "/dashboard", label: "Dashboard" },
        { href: "/courses", label: "Courses" },
        userData?.role === "student" && { href: "/notes", label: "Notes" },
        userData?.role === "student" && { href: "/quiz", label: "Quiz" },
        userData?.role === "student" && {
          href: "/schedule",
          label: "Schedule",
        },
      ].filter(Boolean) as { href: string; label: string }[])
    : [
        { href: "/", label: "Home" },
        { href: "/courses", label: "Courses" },
      ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            to={isAuthed ? "/dashboard" : "/"}
            className="flex items-center gap-2"
          >
            <img
              src="/logo.jpeg"
              alt="Apex Tutorial"
              className="h-9 w-9 rounded-lg object-cover"
            />
            <span className="font-heading text-xl font-bold text-foreground">
              Apex Tutorial
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  isActive(link.href) ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth/User */}
          <div className="hidden items-center gap-4 md:flex">
            {isAuthed ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-foreground hover:text-primary transition-colors"
                  asChild
                >
                  <Link to="/notifications">
                    <Bell className="h-5 w-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
                        {unreadNotifications > 99 ? "99+" : unreadNotifications}
                      </span>
                    )}
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-9 w-9 rounded-full"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={userAvatar} alt={userName} />
                        <AvatarFallback>
                          {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userAvatar} alt={userName} />
                        <AvatarFallback>
                          {userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">{userName}</p>
                        <p className="text-xs text-muted-foreground">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to="/profile"
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="flex items-center gap-2 cursor-pointer text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Log in</Link>
                </Button>
                <Button asChild>
                  <Link to="/auth?mode=signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="border-t border-border py-4 md:hidden animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm font-medium transition-colors hover:text-primary ${
                    isActive(link.href)
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              {isAuthed ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-sm font-medium text-muted-foreground hover:text-primary"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="text-sm font-medium text-destructive"
                  >
                    Log out
                  </Link>
                </>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" asChild className="flex-1">
                    <Link to="/auth">Log in</Link>
                  </Button>
                  <Button asChild className="flex-1">
                    <Link to="/auth?mode=signup">Sign up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
