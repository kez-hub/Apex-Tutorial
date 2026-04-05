# Cloud Functions for Apex Tutorial

This directory contains Cloud Functions that handle backend logic for the Apex Tutorial app, including notifications when instructors publish courses.

## Setup & Deployment

### Prerequisites

- [Node.js](https://nodejs.org/) 18.x or higher
- [Firebase CLI](https://firebase.google.com/docs/cli) installed globally: `npm install -g firebase-tools`
- Firebase project set up with `firebase login` and `firebase init`

### Installation

1. Install dependencies:

```bash
cd functions
npm install
```

2. Build the TypeScript code:

```bash
npm run build
```

### Functions Included

#### `notifyStudentsOnNewCourse` (Firestore Trigger)

- **Trigger**: Fires when a new document is created in the `courses` collection
- **Action**: Automatically creates notification documents for all students
- **Notification Fields**:
  - `courseId`: ID of the new course
  - `courseTitle`: Name of the course
  - `instructorName`: Name of the instructor
  - `type`: "course_published"
  - `read`: false (unread notification)
  - `createdAt`: Timestamp

#### `cleanupOldNotifications` (Pub/Sub Scheduled Trigger)

- **Trigger**: Runs daily at 2 AM UTC
- **Action**: Deletes read notifications older than 30 days
- **Note**: Optional - you can remove if you want to keep all notifications

### Deployment

Deploy to Firebase:

```bash
npm run deploy
```

Or from the root directory:

```bash
firebase deploy --only functions
```

### View Logs

Check function execution logs:

```bash
npm run logs
```

Or in Firebase Console: Functions > Logs

### Local Testing (Optional)

Run local emulator:

```bash
npm run serve
```

Then deploy test changes and observe in the emulator.

## ⚠️ Spark Plan Limitations

Your Spark plan supports:

- ✅ Firestore triggers and reads/writes
- ✅ Cloud Function execution up to 540,000 seconds/month
- ❌ External APIs (would need Blaze plan)
- ❌ Some runtime extensions

**Current setup is fully compatible with Spark plan** since notifications only use Firestore operations.

## Troubleshooting

### Functions don't trigger

1. Ensure `firestore.rules` allows writes to the `courses` collection for instructors
2. Check Firebase Console > Functions > Logs for errors
3. Verify function was deployed: `firebase deploy --only functions`

### Notifications not appearing

1. Check that `users` collection has documents with `role: "student"`
2. Verify notification documents were created in `notifications/{userId}/` subcollections
3. Check the frontend is reading from the correct collection reference

### "Permission denied" errors

1. Ensure `firestore.rules` permissions are correct
2. Verify Cloud Function has proper service account permissions (automatic with Firebase)

## File Structure

```
functions/
├── src/
│   └── index.ts          # Main Cloud Function code
├── lib/                  # Compiled JavaScript (auto-generated)
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── .gitignore           # Git ignore patterns
└── README.md            # This file
```
