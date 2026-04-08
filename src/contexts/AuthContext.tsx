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
  setDoc,
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
  enrolledVideos: string[];
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
  isAdmin?: boolean; // Reserved for future admin features
  passwordHash?: string; // Hashed password for our custom auth
  bio?: string; // Instructor bio
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
  generateTutorialId: (userId: string) => Promise<string>;
  generateTutorialIdForPaidUsers: () => Promise<void>;
  sendPaymentConfirmationEmail: (
    email: string,
    tutorialId: string,
    fulName: string,
    paymentReference: string,
    whatsapp: string,
    department: string,
  ) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Don't set loading to false here - wait for userData to load
      } else {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      // Reset userData when user changes to ensure fresh data loads
      setUserData(null);

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
              enrolledVideos: [],
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
  ): Promise<{ verificationCode: string; tutorialId: string }> => {
    const userDocRef = doc(db, "users", userObj.uid);
    const counterDocRef = doc(db, "metadata", "counters");

    // Generate random 6 digit numeric code
    const verificationCode = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    // Tutorial ID will be generated when payment is made, not at signup
    const tutorialId = "";

    await runTransaction(db, async (transaction) => {
      transaction.set(userDocRef, {
        email,
        full_name: fullName,
        tutorialId, // Empty string - will be generated on payment
        department: department || "",
        whatsapp: whatsapp || "",
        enrolledVideos: [],
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

    return { verificationCode, tutorialId };
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

      const result = await createUserDataAtomic(
        userObj,
        fullName,
        email,
        role,
        department,
        whatsapp,
        passwordHash, // Pass the hashed password
      );

      const vCode = result.verificationCode;
      const tutorialId = result.tutorialId;

      const emailParams = {
        passcode: vCode,
        time: new Date(Date.now() + 15 * 60000).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        email: email,
      }; // Verification email - no tutorial ID

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
        const result = await createUserDataAtomic(
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
      const userData = userDoc.data();
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
      }; // Password reset email - no tutorial ID

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

  const generateTutorialIdForPaidUsers = async (): Promise<void> => {
    try {
      // Get all users who have hasPaid = true but no tutorialId
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("hasPaid", "==", true),
        where("tutorialId", "==", "")
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log("No users found who need tutorial IDs");
        return;
      }

      console.log(`Found ${querySnapshot.size} users who need tutorial IDs`);

      const counterDocRef = doc(db, "metadata", "counters");

      // Process each user
      for (const userDoc of querySnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Generate tutorial ID
        const counterDoc = await getDoc(counterDocRef);
        let currentCount = 0;

        if (counterDoc.exists()) {
          currentCount = counterDoc.data().userCount || 0;
        }

        const newCount = currentCount + 1;
        const tutorialId = "APEX-" + String(newCount).padStart(3, "0");

        // Update user with tutorial ID
        await updateDoc(userDoc.ref, { tutorialId });

        // Update counter
        await setDoc(counterDocRef, { userCount: newCount }, { merge: true });

        console.log(`Generated tutorial ID ${tutorialId} for user ${userId}`);

        // Send payment confirmation email
        const emailResult = await sendPaymentConfirmationEmail(
          userData.email || "",
          tutorialId,
          userData.full_name || "Student",
          userData.paymentReference || "MANUAL",
          userData.whatsapp || "",
          userData.department || "",
        );

        if (!emailResult) {
          console.error(`Failed to send email for user ${userId}`);
        }
      }

      console.log("Tutorial ID generation completed");
    } catch (error) {
      console.error("Error generating tutorial IDs:", error);
      throw error;
    }
  };

  const generateTutorialId = async (userId: string): Promise<string> => {
    const userDocRef = doc(db, "users", userId);
    const counterDocRef = doc(db, "metadata", "counters");

    let tutorialId = "";

    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterDocRef);
      let currentCount = 0;

      if (counterDoc.exists()) {
        currentCount = counterDoc.data().userCount || 0;
      }

      const newCount = currentCount + 1;
      tutorialId = "APEX-" + String(newCount).padStart(3, "0");

      transaction.set(counterDocRef, { userCount: newCount }, { merge: true });
      transaction.update(userDocRef, { tutorialId });
    });

    return tutorialId;
  };

  const sendPaymentConfirmationEmail = async (
    email: string,
    tutorialId: string,
    fulName: string,
    paymentReference: string,
    whatsapp: string,
    department: string,
  ): Promise<boolean> => {
    try {
      const emailParams = {
        email,
        tutorialId,
        fulName,
        paymentReference,
        amount: "100",
        whatsapp,
        department,
      };

      await emailjs.send(
        "service_29d3d1f",
        "template_e9171bm",
        emailParams,
        "SVWb5wSsyH14FfE4I",
      );
      console.log("Payment confirmation email sent successfully.");
      return true;
    } catch (err) {
      console.error("Failed to send payment confirmation email", err);
      return false;
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
        generateTutorialId,
        generateTutorialIdForPaidUsers,
        sendPaymentConfirmationEmail,
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
