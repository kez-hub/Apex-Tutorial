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

/**
 * Cloud Function triggered when a user's hasPaid field changes to true.
 * Generates tutorial ID and sends payment confirmation email.
 */
export const onPaymentCompleted = functions.firestore
  .document("users/{userId}")
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Check if hasPaid changed from false to true
    if (!beforeData?.hasPaid && afterData?.hasPaid) {
      console.log(`Payment completed for user: ${userId}`);

      try {
        // Generate tutorial ID using timestamp + random format
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomChars = Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();
        const tutorialId = `APEX-${timestamp}-${randomChars}`;

        // Update user document with tutorial ID
        await db.collection("users").doc(userId).update({
          tutorialId: tutorialId,
        });

        console.log(`Generated tutorial ID: ${tutorialId} for user: ${userId}`);

        // Send payment confirmation email using EmailJS REST API
        const emailParams = {
          email: afterData.email,
          tutorialId,
          fulName: afterData.full_name || "Student",
          paymentReference: afterData.paymentReference || "MANUAL",
          amount: "10,300",
          whatsapp: afterData.whatsapp || "",
          department: afterData.department || "",
        };

        const emailData = {
          service_id: "service_29d3d1f",
          template_id: "template_e9171bm",
          user_id: "SVWb5wSsyH14FfE4I",
          template_params: emailParams,
        };

        const emailResponse = await fetch(
          "https://api.emailjs.com/api/v1.0/email/send",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(emailData),
          },
        );

        if (!emailResponse.ok) {
          console.error("Failed to send email:", await emailResponse.text());
          throw new Error("Email sending failed");
        }

        console.log("Payment confirmation email sent successfully");

        return {
          success: true,
          tutorialId,
          emailSent: true,
        };
      } catch (error) {
        console.error("Error processing payment completion:", error);
        throw error;
      }
    }

    return null;
  });
