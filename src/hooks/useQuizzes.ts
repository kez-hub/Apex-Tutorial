import { useState, useEffect } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Quiz {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseTitle: string;
  questions: number;
  duration: number; // in minutes
  difficulty: "easy" | "medium" | "hard";
  completed: boolean;
  score?: number;
  maxScore?: number;
  completedAt?: Date;
  instructorId: string;
  instructorName: string;
  createdAt: string;
  updatedAt: string;
}

export function useQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const quizzesQuery = query(
      collection(db, "quizzes"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      quizzesQuery,
      (snapshot) => {
        const fetchedQuizzes = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Quiz[];

        setQuizzes(fetchedQuizzes);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching quizzes:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { quizzes, loading };
}
