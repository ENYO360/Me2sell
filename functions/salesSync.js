const admin = require("firebase-admin");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");

admin.initializeApp();

exports.syncProductSales = onDocumentWritten(
  "products/{uid}/productList/{productId}",
  async (event) => {
    const before = event.data?.before;
    const after = event.data?.after;

    // Deleted or newly created → ignore
    if (!before.exists || !after.exists) return;

    const beforeData = before.data();
    const afterData = after.data();

    const beforeQty = beforeData.quantity ?? 0;
    const afterQty = afterData.quantity ?? 0;

    // Quantity did NOT reduce → do nothing
    if (afterQty >= beforeQty) return;

    const soldIncrease = beforeQty - afterQty;

    const db = admin.firestore();
    const marketplaceRef = db
      .collection("marketplaceProducts")
      .doc(event.params.productId);

    await db.runTransaction(async (tx) => {
      const snap = await tx.get(marketplaceRef);
      if (!snap.exists) return;

      const currentSold = snap.data().sold ?? 0;

      tx.update(marketplaceRef, {
        sold: currentSold + soldIncrease,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  }
);
