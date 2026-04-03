import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, setDoc, doc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course, courses as initialCourses } from '@/lib/data';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial Seeding Check
    const seedInitialData = async () => {
      const q = query(collection(db, "courses"));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log("Seeding initial courses to Firestore...");
        for (const course of initialCourses) {
          await setDoc(doc(db, "courses", course.id), course);
        }
      }
    };

    seedInitialData().catch(err => {
      // Silently ignore seeding errors (e.g. permission denied)
      console.warn("Initial seeding skipped or failed:", err.message);
    }).finally(() => {
      // 2. Real-time Listener
      const unsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
        const fetchedCourses = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Course[];
        
        // Sort by ID or creation if needed
        setCourses(fetchedCourses);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching courses:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    });
  }, []);

  return { courses, loading };
}
