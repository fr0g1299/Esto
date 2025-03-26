import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * Updates the trending properties collection in the database.
 * This function is triggered every day at 23:50.
 * It fetches the top 15 properties based on the number of views and updates the trending collection.
 * Old trending documents are deleted, and new ones are added.
 *
 * @schedule Every day at 23:50 (Europe/Prague timezone)
 * @async
 */
export const updateTrending = onSchedule(
  {
    schedule: "every day 23:50",
    timeZone: "Europe/Prague",
  },
  async () => {
    const snapshot = await db
      .collection("properties")
      .orderBy("views", "desc")
      .limit(15)
      .get();

    const batch = db.batch();
    const trendingRef = db.collection("trending");

    // Delete old trending documents
    const old = await trendingRef.get();
    old.forEach((doc) => batch.delete(doc.ref));

    // Add new trending documents
    snapshot.docs.forEach((doc) => {
      const { title, imageUrl, price, views } = doc.data();
      batch.set(trendingRef.doc(), {
        propertyId: doc.id,
        title,
        imageUrl,
        price,
        views,
      });
    });

    await batch.commit();
    console.log("Trending properties updated successfully.");
  }
);
