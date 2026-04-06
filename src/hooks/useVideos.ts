import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Video } from "@/lib/data";

export function useVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "videos"),
      (snapshot) => {
        const fetchedVideos = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        })) as Video[];

        setVideos(fetchedVideos);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching videos:", error);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, []);

  return { videos, loading };
}
