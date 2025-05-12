import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

export const removeProperty = onCall(async (request) => {
  const propertyId = request.data.propertyId;

  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User not authenticated");
  }

  try {
    const db = admin.firestore();
    const storage = admin.storage();

    const propertyRef = db.doc(`properties/${propertyId}`);
    const detailsRef = db.doc(`properties/${propertyId}/details/data`);
    const imagesCollection = db.collection(`properties/${propertyId}/images`);

    // 1. Delete all related documents
    await detailsRef.delete();
    const imagesSnapshot = await imagesCollection.get();
    await Promise.all(imagesSnapshot.docs.map((doc) => doc.ref.delete()));

    // 2. Delete storage images
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({
      prefix: `properties/${propertyId}/images/`,
    });
    await Promise.all(files.map((file) => file.delete()));

    // 3. Delete from all user favorites and notifications
    const usersSnapshot = await db.collection("users").get();
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Remove notifications
      const notifRef = db.doc(
        `users/${userId}/notificationsPreferences/${propertyId}`
      );
      await notifRef.delete();

      // Remove from folders
      const foldersSnapshot = await db
        .collection(`users/${userId}/favoriteFolders`)
        .get();
      for (const folderDoc of foldersSnapshot.docs) {
        const folderData = folderDoc.data();
        const propRef = db.doc(
          `users/${userId}/favoriteFolders/${folderDoc.id}/properties/${propertyId}`
        );
        const propSnapshot = await propRef.get();

        if (propSnapshot.exists) {
          await propRef.delete();
          await folderDoc.ref.update({
            propertyCount: (folderData.propertyCount || 1) - 1,
          });
        }
      }
    }

    // 4. Delete main property
    await propertyRef.delete();

    return { success: true };
  } catch (err) {
    console.error("Error deleting property:", err);
    throw new HttpsError("internal", "Failed to delete property");
  }
});
