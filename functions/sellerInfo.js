const admin = require("firebase-admin");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");

admin.initializeApp();

exports.syncMarketplaceSellerInfo = onDocumentUpdated(
  "businessProfiles/{uid}",
  async (event) => {
    const { uid } = event.params;
    const db = admin.firestore();

    const after = event.data.after.data();
    if (!after) return;

    const sellerData = {
      businessName: after.business?.businessName || "",
      businessType: after.business?.businessType || "",
      phone: after.admin?.phone?.full || "",
      address: after.business?.businessAddress || "",
      country: after.business?.country || "",
      currencyName: after.business?.currency?.name || "",
      currencySymbol: after.business?.currency?.symbol || "",
      whatsappLink: after.admin?.phone?.full
        ? `https://wa.me/${after.admin.phone.full.replace(/\D/g, "")}`
        : "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const snap = await db
      .collection("marketplaceProducts")
      .where("sellerId", "==", uid)
      .get();

    if (snap.empty) return;

    const batch = db.batch();
    snap.docs.forEach((doc) => {
      batch.update(doc.ref, sellerData);
    });

    await batch.commit();
  }
);