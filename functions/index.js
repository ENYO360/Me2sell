const admin = require("firebase-admin");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");

admin.initializeApp();

exports.syncMarketplaceProduct = onDocumentWritten(
  "products/{uid}/productList/{productId}",
  async (event) => {
    const { uid, productId } = event.params;
    const db = admin.firestore();

    const before = event.data?.before;
    const after = event.data?.after;

    // 🗑 PRODUCT DELETED
    if (!after.exists) {
      await db.collection("marketplaceProducts").doc(productId).delete();
      return;
    }

    const product = after.data();

    // 🔎 Fetch seller info
    const sellerSnap = await db.doc(`businessProfiles/${uid}`).get();
    if (!sellerSnap.exists) return;

    const seller = sellerSnap.data();

    const marketplaceData = {
      productId,
      sellerId: uid,

      name: product.name,
      nameLower: (product.name || "").toLowerCase(),
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      description: product.description || "",

      image: product.image || "",
      image2: product.image2 || "",

      categoryId: product.categoryId || "",
      department: product.department || "",

      businessName: seller.business?.businessName || "",
      businessType: seller.business?.businessType || "",
      phone: seller.admin.phone?.full || "",
      address: seller.business?.businessAddress || "",
      country: seller.business?.country || "",
      currencyName: seller.business?.currency?.name || "",
      currencySymbol: seller.business?.currency?.symbol || "",
      whatsappLink: seller.admin.phone?.full
        ? `https://wa.me/${seller.admin.phone?.full.replace(/\D/g, "")}`
        : "",

      updatedAt: admin.firestore.FieldValue.serverTimestamp(),

      // Only set createdAt once
      ...(before.exists
        ? {}
        : { createdAt: admin.firestore.FieldValue.serverTimestamp() }),
    };

    await db
      .collection("marketplaceProducts")
      .doc(productId)
      .set(marketplaceData, { merge: true });
  }
);

exports.sellerInfo = require("./sellerInfo");
exports.salesSync = require("./salesSync");
exports.locationSync = require("./locationSync");
