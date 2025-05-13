import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

export const usernameTaken = onCall(async (request) => {
  const username = request.data.username;
  const db = admin.firestore();

  if (!username || typeof username !== "string") {
    throw new HttpsError("invalid-argument", "A valid username is required");
  }

  try {
    // Query Firestore for the username
    const snapshot = await db
      .collection("users")
      .where("username", "==", username)
      .get();

    // Return whether the username is taken
    return { isTaken: !snapshot.empty };
  } catch (error) {
    console.error("Error checking username:", error);
    throw new HttpsError("internal", "Unable to check username availability");
  }
});
