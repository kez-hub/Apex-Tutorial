import { updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface StreakData {
  learningStreak: number;
  lastActiveDate: string;
}

/**
 * Calculate the number of days between two dates (ignoring time)
 */
function getDaysDifference(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Update learning streak based on user's activity
 * - If same day: no change
 * - If exactly 1 day later: increment streak
 * - If more than 1 day later: reset streak to 1
 */
export async function updateStreak(userId: string): Promise<StreakData | null> {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const userData = userDoc.data();
    const now = new Date();
    const todayString = now.toISOString().split("T")[0]; // YYYY-MM-DD format
    const lastActiveDate = userData.lastActiveDate || null;

    // If last active date is today, no update needed
    if (lastActiveDate === todayString) {
      return {
        learningStreak: userData.learningStreak || 1,
        lastActiveDate: todayString,
      };
    }

    let newStreak = userData.learningStreak || 0;

    if (lastActiveDate) {
      const lastDate = new Date(lastActiveDate);
      const daysDiff = getDaysDifference(lastDate, now);

      if (daysDiff === 1) {
        // Consecutive day: increment streak
        newStreak += 1;
      } else if (daysDiff > 1) {
        // Missed days: reset streak to 1
        newStreak = 1;
      }
      // If daysDiff === 0 (same day), do nothing to newStreak
    } else {
      // First time activity: start streak at 1
      newStreak = 1;
    }

    // Update Firestore
    await updateDoc(userRef, {
      learningStreak: newStreak,
      lastActiveDate: todayString,
    });

    return {
      learningStreak: newStreak,
      lastActiveDate: todayString,
    };
  } catch (error) {
    console.error("Error updating streak:", error);
    return null;
  }
}
