import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();

interface CourseData {
  title: string;
  instructorId: string;
  instructorName: string;
  description?: string;
  image?: string;
  category?: string;
  level?: string;
  price?: number;
}

/**
 * Cloud Function triggered when a new course is created.
 * Creates notification documents for all students.
 */
export const notifyStudentsOnNewCourse = functions.firestore
  .document("courses/{courseId}")
  .onCreate(async (snap, context) => {
    try {
      const courseData = snap.data() as CourseData;
      const courseId = context.params.courseId;

      console.log(
        `New course created: ${courseData.title} by ${courseData.instructorName}`,
      );

      // Fetch all students (users with role === "student")
      const studentsSnapshot = await db
        .collection("users")
        .where("role", "==", "student")
        .get();

      if (studentsSnapshot.empty) {
        console.log("No students found to notify");
        return;
      }

      console.log(`Found ${studentsSnapshot.size} students to notify`);

      // Create a batch write to efficiently create notifications for all students
      const batch = db.batch();
      const timestamp = admin.firestore.Timestamp.now();

      studentsSnapshot.docs.forEach((studentDoc) => {
        const studentId = studentDoc.id;

        // Create unique notification ID
        const notificationId = db.collection("notifications").doc().id;

        // Reference to the notification document
        const notificationRef = db.doc(
          `notifications/${studentId}/${notificationId}`,
        );

        // Create the notification
        batch.set(notificationRef, {
          courseId: courseId,
          courseTitle: courseData.title,
          instructorName: courseData.instructorName,
          instructorId: courseData.instructorId,
          description: courseData.description || "",
          image: courseData.image || "",
          type: "course_published",
          read: false,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      });

      // Commit the batch write
      await batch.commit();
      console.log(
        `Successfully created notifications for ${studentsSnapshot.size} students`,
      );

      return {
        success: true,
        studentsNotified: studentsSnapshot.size,
      };
    } catch (error) {
      console.error("Error notifying students of new course:", error);
      throw error;
    }
  });

/**
 * (Optional) Cloud Function to delete old notifications
 * Runs daily at 2 AM UTC to clean up read notifications older than 30 days
 */
export const cleanupOldNotifications = functions.pubsub
  .schedule("0 2 * * *")
  .timeZone("UTC")
  .onRun(async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get all user IDs
      const usersSnapshot = await db.collection("users").get();

      let totalDeleted = 0;

      // Process each user's notifications
      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // Find old read notifications
        const oldNotificationsQuery = await db
          .collection(`notifications/${userId}`)
          .where("read", "==", true)
          .where(
            "createdAt",
            "<",
            admin.firestore.Timestamp.fromDate(thirtyDaysAgo),
          )
          .limit(100); // Process in batches

        const oldNotificationsSnap = await oldNotificationsQuery.get();

        if (!oldNotificationsSnap.empty) {
          const deleteBatch = db.batch();

          oldNotificationsSnap.docs.forEach((notificationDoc) => {
            deleteBatch.delete(notificationDoc.ref);
          });

          await deleteBatch.commit();
          totalDeleted += oldNotificationsSnap.size;
        }
      }

      console.log(
        `Cleanup completed. Deleted ${totalDeleted} old notifications`,
      );
      return { success: true, deleted: totalDeleted };
    } catch (error) {
      console.error("Error in notification cleanup:", error);
      throw error;
    }
  });
