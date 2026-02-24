const admin = require("firebase-admin");

const {
  onCall,
  HttpsError,
} = require("firebase-functions/v2/https");

const {
  onSchedule,
} = require("firebase-functions/v2/scheduler");

// Safe fetch
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

admin.initializeApp();

/* ================================
   CALLABLE: Update User Location
================================ */
exports.updateUserLocation = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "User must be authenticated"
    );
  }

  const uid = request.auth.uid;

  let clientIP =
    request.data?.ip ||
    request.rawRequest?.headers["x-forwarded-for"] ||
    request.rawRequest?.ip ||
    "";

  if (Array.isArray(clientIP)) {
    clientIP = clientIP[0];
  }

  if (typeof clientIP === "string" && clientIP.includes(",")) {
    clientIP = clientIP.split(",")[0].trim();
  }

  if (!clientIP) {
    throw new HttpsError(
      "failed-precondition",
      "IP not detected"
    );
  }

  try {
    const res = await fetch(
      `https://ipapi.co/${clientIP}/json/`
    );

    const data = await res.json();

    if (data?.error) {
      throw new Error("Geo lookup failed");
    }

    const locationInfo = {
      city: data.city || "",
      state: data.region || "",
      country: data.country_name || "",
      latitude: Number(data.latitude) || 0,
      longitude: Number(data.longitude) || 0,
      ip: clientIP,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    const profileRef = admin
      .firestore()
      .doc(`businessProfiles/${uid}`);

    const snap = await profileRef.get();

    let shouldUpdate = true;

    if (snap.exists) {
      const existing =
        snap.data()?.business?.location;

      if (existing) {
        const ipChanged = existing.ip !== clientIP;
        const cityChanged = existing.city !== locationInfo.city;

        const coordsChanged =
          Math.abs(existing.latitude - locationInfo.latitude) >
          0.05 ||
          Math.abs(existing.longitude - locationInfo.longitude) >
          0.05;

        shouldUpdate = ipChanged || cityChanged || coordsChanged;
      }
    }

    if (shouldUpdate) {
      await profileRef.set(
        {
          business: {
            location: locationInfo,
          },
        },
        { merge: true }
      );

      return {
        success: true,
        updated: true,
        location: locationInfo,
      };
    }

    return {
      success: true,
      updated: false,
      location: locationInfo,
    };
  } catch (err) {
    console.error("Location error:", err);

    throw new HttpsError(
      "internal",
      "Location update failed"
    );
  }
});

/* ================================
   SCHEDULED: Weekly Update
================================ */
exports.scheduledLocationUpdate = onSchedule(
  {
    schedule: "0 2 * * 0", // Every Sunday 2AM UTC
    timeZone: "UTC",
  },
  async () => {
    const db = admin.firestore();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let lastDoc = null;
    let processed = 0;

    const batchSize = 300;

    while (true) {
      let q = db
        .collection("businessProfiles")
        .where("lastActivity", ">=", thirtyDaysAgo)
        .orderBy("lastActivity", "desc")
        .limit(batchSize);

      if (lastDoc) q = q.startAfter(lastDoc);

      const snap = await q.get();

      if (snap.empty) break;

      for (const doc of snap.docs) {
        const location =
          doc.data()?.business?.location;

        if (!location?.ip) continue;

        try {
          const res = await fetch(
            `https://ipapi.co/${location.ip}/json/`
          );

          const data = await res.json();

          if (data?.error) continue;

          const newLocation = {
            city: data.city || "",
            state: data.region || "",
            country: data.country_name || "",
            latitude: Number(data.latitude) || 0,
            longitude: Number(data.longitude) || 0,
            ip: location.ip,
            timestamp:
              admin.firestore.FieldValue.serverTimestamp(),
          };

          const cityChanged =
            location.city !== newLocation.city;

          const coordsChanged =
            Math.abs(location.latitude - newLocation.latitude) >
            0.05 ||
            Math.abs(location.longitude - newLocation.longitude) >
            0.05;

          if (cityChanged || coordsChanged) {
            await doc.ref.update({
              "business.location": newLocation,
            });

            console.log("Updated:", doc.id);
          }
        } catch (e) {
          console.error("Failed:", doc.id, e);
        }
      }

      processed += snap.size;
      lastDoc = snap.docs[snap.size - 1];

      await new Promise((r) => setTimeout(r, 800));
    }

    console.log(`Processed ${processed} profiles`);
  }
);