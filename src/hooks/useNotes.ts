import { useState, useEffect } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Note {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  pdfUrl: string;
  instructor: string;
  instructorId: string;
  instructorAvatar: string;
  level: string;
  createdAt: string;
  updatedAt: string;
}

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const notesQuery = query(
      collection(db, "notes"),
      orderBy("createdAt", "desc"),
    );

    const unsubscribe = onSnapshot(
      notesQuery,
      (snapshot) => {
        const fetchedNotes = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Note[];

        setNotes(fetchedNotes);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching notes:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { notes, loading };
}
