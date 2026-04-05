import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Course } from "@/lib/data";

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "courses"),
      (snapshot) => {
        const fetchedCourses = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Course[];

        setCourses(fetchedCourses);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching courses:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { courses, loading };
}
