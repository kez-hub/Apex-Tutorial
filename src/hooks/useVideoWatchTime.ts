import { useEffect, useRef } from "react";
import { updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { updateStreak } from "./useLearningStreak";

interface UseVideoWatchTimeProps {
  userId?: string;
  videoId?: string;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  enabled?: boolean;
}

const SAVE_INTERVAL = 30000; // Save progress every 30 seconds
const MINIMUM_WATCH_PERCENT = 0.1; // Only count as watched if 10% watched

export function useVideoWatchTime({
  userId,
  videoId,
  isPlaying,
  currentTime,
  duration,
  enabled = true,
}: UseVideoWatchTimeProps) {
  const watchStartTimeRef = useRef<number>(0);
  const accumulatedTimeRef = useRef<number>(0);
  const lastSaveTimeRef = useRef<number>(0);
  const hasBeenCountedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!userId || !videoId || !enabled || duration === 0) return;

    // Start tracking when video plays
    if (isPlaying && watchStartTimeRef.current === 0) {
      watchStartTimeRef.current = Date.now();
    }

    // Stop tracking when video pauses
    if (!isPlaying && watchStartTimeRef.current > 0) {
      const watchDuration = (Date.now() - watchStartTimeRef.current) / 1000;
      accumulatedTimeRef.current += Math.min(watchDuration, 60); // Cap single session to 60 seconds
      watchStartTimeRef.current = 0;
    }

    // Periodically save watch time to Firestore
    const interval = setInterval(async () => {
      if (isPlaying && accumulatedTimeRef.current > 0) {
        const now = Date.now();
        if (now - lastSaveTimeRef.current < SAVE_INTERVAL) return;

        const watchPercentage = currentTime / duration;

        try {
          // Only update if watched at least MINIMUM_WATCH_PERCENT of video
          if (watchPercentage >= MINIMUM_WATCH_PERCENT) {
            const userRef = doc(db, "users", userId);
            const userDoc = await getDoc(userRef);

            if (userDoc.exists()) {
              const currentHours = userDoc.data().hoursLearned || 0;
              // Add accumulated time in hours
              const watchTimeInHours = accumulatedTimeRef.current / 3600;
              const newHours = Math.min(currentHours + watchTimeInHours, 99999); // Cap to prevent overflow

              await updateDoc(userRef, {
                hoursLearned: newHours,
              });

              // Update learning streak for daily activity
              await updateStreak(userId);

              // Mark as counted after first update
              if (!hasBeenCountedRef.current) {
                hasBeenCountedRef.current = true;
              }

              accumulatedTimeRef.current = 0;
              lastSaveTimeRef.current = now;
            }
          }
        } catch (error) {
          console.error("Error updating watch time:", error);
        }
      }
    }, SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [userId, videoId, isPlaying, currentTime, duration, enabled]);

  // Cleanup and final save when component unmounts
  useEffect(() => {
    return () => {
      if (
        userId &&
        videoId &&
        accumulatedTimeRef.current > 0 &&
        watchStartTimeRef.current > 0
      ) {
        const watchDuration = (Date.now() - watchStartTimeRef.current) / 1000;
        accumulatedTimeRef.current += Math.min(watchDuration, 60);

        // Final save on unmount
        updateDoc(doc(db, "users", userId), {
          hoursLearned:
            accumulatedTimeRef.current / 3600 +
            (getDoc(doc(db, "users", userId))
              .then((doc) => doc.data()?.hoursLearned || 0)
              .catch(() => 0) as unknown as number),
        }).catch((error) => console.error("Error in final save:", error));

        // Update streak on final save
        updateStreak(userId).catch((error) =>
          console.error("Error updating streak on unmount:", error),
        );
      }
    };
  }, [userId, videoId]);
}
