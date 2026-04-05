import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import emailjs from "@emailjs/browser";
import bcrypt from "bcryptjs";
import { LearningAlarm } from "@/lib/data";

export interface UserData {
  full_name?: string;
  department?: string;
  whatsapp?: string;
  tutorialId: string;
  enrolledCourses: string[];
  hoursLearned: number;
  learningStreak: number;
  alarms: LearningAlarm[];
  createdAt?: string;
  isVerified: boolean;
  verificationCode?: string;
  avatarBase64?: string;
  bannerBase64?: string;
  hasPaid: boolean;
  role: "student" | "instructor";
  passwordHash?: string; // Hashed password for our custom auth
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: "student" | "instructor",
    department?: string,
    whatsapp?: string,
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  sendPasswordResetCode: (email: string) => Promise<{ error: Error | null }>;
  verifyResetCode: (
    email: string,
    code: string,
  ) => Promise<{ error: Error | null }>;
  resetPassword: (
    email: string,
    code: string,
    newPassword: string,
  ) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribeDoc = onSnapshot(
        doc(db, "users", user.uid),
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              ...data,
              // Fallback for legacy accounts missing these fields
              role: data.role || "student",
              hasPaid: data.hasPaid || false,
              isVerified: data.isVerified || false,
            } as UserData);
          } else {
            setUserData({
              tutorialId: "",
              enrolledCourses: [],
              hoursLearned: 0,
              learningStreak: 0,
              alarms: [],
              isVerified: false,
              hasPaid: false,
              role: "student",
            });
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching user data:", error);
          setLoading(false);
        },
      );
      return () => unsubscribeDoc();
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      // First, get the user data from Firestore to check the hashed password
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error("User not found");
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as UserData;
      const passwordHash = userData.passwordHash;

      if (!passwordHash) {
        throw new Error("Password not set for this account");
      }

      // Verify the password
      const isPasswordValid = await bcrypt.compare(password, passwordHash);
      if (!isPasswordValid) {
        throw new Error("Invalid password");
      }

      // If password is valid, sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const createUserDataAtomic = async (
    userObj: User,
    fullName: string,
    email: string,
    role: "student" | "instructor" = "student",
    department?: string,
    whatsapp?: string,
    passwordHash?: string,
  ) => {
    const userDocRef = doc(db, "users", userObj.uid);
    const counterDocRef = doc(db, "metadata", "counters");

    // Generate random 6 digit numeric code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterDocRef);
      let currentCount = 0;

      if (counterDoc.exists()) {
        currentCount = counterDoc.data().userCount || 0;
      }

      // Only generate tutorial ID for students, not instructors
      let tutorialId = "";
      if (role === "student") {
        const newCount = currentCount + 1;
        tutorialId = "APEX-" + String(newCount).padStart(3, "0");
        transaction.set(
          counterDocRef,
          { userCount: newCount },
          { merge: true },
        );
      }

      transaction.set(userDocRef, {
        email,
        full_name: fullName,
        tutorialId, // Empty string for instructors
        department: department || "",
        whatsapp: whatsapp || "",
        enrolledCourses: [],
        hoursLearned: 0,
        learningStreak: 0,
        alarms: [],
        isVerified: false,
        verificationCode,
        hasPaid: false,
        role,
        passwordHash: passwordHash || null,
        createdAt: new Date().toISOString(),
      });
    });

    return verificationCode;
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: "student" | "instructor" = "student",
    department?: string,
    whatsapp?: string,
  ) => {
    try {
      // Hash the password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password, // Still create Firebase Auth account for other features
      );
      const userObj = userCredential.user;

      await updateProfile(userObj, { displayName: fullName });

      const vCode = await createUserDataAtomic(
        userObj,
        fullName,
        email,
        role,
        department,
        whatsapp,
        passwordHash, // Pass the hashed password
      );

      const emailParams = {
        passcode: vCode,
        time: new Date(Date.now() + 15 * 60000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        email: email,
      };

      try {
        await emailjs.send(
          "service_29d3d1f",
          "template_pyppw0d",
          emailParams,
          "SVWb5wSsyH14FfE4I",
        );
        console.log("OTP Email dispatched effectively.");
      } catch (err) {
        console.error("Failed to send EmailJS OTP", err);
      }

      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const userObj = userCredential.user;

      const docRef = doc(db, "users", userObj.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        await createUserDataAtomic(
          userObj,
          userObj.displayName || "Google User",
          userObj.email || "",
          "student",
        );
        // Google users are pre-verified via Google's OAuth
        await updateDoc(docRef, { isVerified: true });
      }

      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const sendPasswordResetCode = async (email: string) => {
    try {
      // Check if user exists
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { error: new Error("No account found with this email address") };
      }

      // Generate reset code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Store reset code in user document
      const userDoc = querySnapshot.docs[0];
      await updateDoc(userDoc.ref, {
        resetCode,
        resetCodeExpiry: new Date(Date.now() + 15 * 60000).toISOString(), // 15 minutes
      });

      // Send email with reset code
      const emailParams = {
        passcode: resetCode,
        time: new Date(Date.now() + 15 * 60000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        email: email,
      };

      try {
        await emailjs.send(
          "service_29d3d1f",
          "template_pyppw0d",
          emailParams,
          "SVWb5wSsyH14FfE4I",
        );
        console.log("Password reset code sent successfully.");
      } catch (err) {
        console.error("Failed to send password reset email", err);
        return {
          error: new Error("Failed to send reset email. Please try again."),
        };
      }

      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const verifyResetCode = async (email: string, code: string) => {
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return { error: new Error("No account found with this email address") };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      if (userData.resetCode !== code) {
        return { error: new Error("Invalid reset code") };
      }

      if (new Date() > new Date(userData.resetCodeExpiry)) {
        return { error: new Error("Reset code has expired") };
      }

      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const resetPassword = async (
    email: string,
    code: string,
    newPassword: string,
  ) => {
    try {
      // First verify the code
      const verifyResult = await verifyResetCode(email, code);
      if (verifyResult.error) {
        return verifyResult;
      }

      // Hash the new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update the password hash in Firestore
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      const userDoc = querySnapshot.docs[0];

      await updateDoc(userDoc.ref, {
        passwordHash,
        resetCode: null,
        resetCodeExpiry: null,
      });

      return { error: null };
    } catch (e) {
      console.error("Password reset error:", e);
      return { error: e as Error };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
        signIn,
        signUp,
        signOut,
        signInWithGoogle,
        sendPasswordResetCode,
        verifyResetCode,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
