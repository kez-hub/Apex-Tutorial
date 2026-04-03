import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { 
  User, onAuthStateChanged, signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, signOut as firebaseSignOut, 
  GoogleAuthProvider, signInWithPopup, updateProfile
} from "firebase/auth";
import { doc, getDoc, onSnapshot, runTransaction, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import emailjs from "@emailjs/browser";
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
  role: 'student' | 'instructor';
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role?: 'student' | 'instructor', department?: string, whatsapp?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
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
      const unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserData);
        } else {
          setUserData({
            tutorialId: "",
            enrolledCourses: [],
            hoursLearned: 0,
            learningStreak: 0,
            alarms: [],
            isVerified: false,
            hasPaid: false,
            role: 'student'
          });
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      });
      return () => unsubscribeDoc();
    }
  }, [user]);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const createUserDataAtomic = async (userObj: User, fullName: string, email: string, role: 'student' | 'instructor' = 'student', department?: string, whatsapp?: string) => {
    const userDocRef = doc(db, "users", userObj.uid);
    const counterDocRef = doc(db, "metadata", "counters");

    // Generate random 6 digit numeric code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterDocRef);
      let currentCount = 0;
      
      if (counterDoc.exists()) {
        currentCount = counterDoc.data().userCount || 0;
      }
      
      const newCount = currentCount + 1;
      const tutorialId = "APEX-" + String(newCount).padStart(3, "0");
      
      transaction.set(counterDocRef, { userCount: newCount }, { merge: true });
      
      transaction.set(userDocRef, {
        email,
        full_name: fullName,
        tutorialId,
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
        createdAt: new Date().toISOString(),
      });
    });

    return verificationCode;
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'student' | 'instructor' = 'student', department?: string, whatsapp?: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userObj = userCredential.user;
      
      await updateProfile(userObj, { displayName: fullName });
            
      const vCode = await createUserDataAtomic(userObj, fullName, email, role, department, whatsapp);
      
      const emailParams = {
        passcode: vCode,
        time: new Date(Date.now() + 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        email: email,
      };

      try {
        await emailjs.send(
          "service_29d3d1f",
          "template_pyppw0d",
          emailParams,
          "SVWb5wSsyH14FfE4I"
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
        await createUserDataAtomic(userObj, userObj.displayName || "Google User", userObj.email || "", 'student');
        // Google users are pre-verified via Google's OAuth
        await updateDoc(docRef, { isVerified: true });
      }

      return { error: null };
    } catch (e) {
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
