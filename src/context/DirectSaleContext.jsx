import React, { createContext, useContext, useState } from "react";
import {
    doc,
    updateDoc,
    addDoc,
    collection,
    serverTimestamp,
    setDoc,
    increment,
    runTransaction,
    getDoc
} from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { useNotification } from "./NotificationContext";
import { useConfirmModal } from "./ConfirmationContext";
import { useCurrency } from "./CurrencyContext";

const DirectSaleContext = createContext();
export const useDirectSale = () => useContext(DirectSaleContext);

export const DirectSaleProvider = ({ children }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isSaleModalOpen, setSaleModalOpen] = useState(false);

    const { notify } = useNotification();
    const { openConfirm } = useConfirmModal();
    const { currency } = useCurrency();

    // 🔵 Open Modal
    const startSale = (product) => {
        setSelectedProduct(product);
        setSaleModalOpen(true);
    };

    // 🔴 Close Modal
    const cancelSale = () => {
        setSelectedProduct(null);
        setSaleModalOpen(false);
    };

    // 🟢 Confirm Sale
    const confirmSale = async (editedPrice) => {
        if (!selectedProduct) return;

        const user = auth.currentUser;
        if (!user) return;

        try {
            const profit =
                editedPrice - (selectedProduct.costPrice || 0);

            const today = new Date();
            const todayKey = `${today.getFullYear()}-${String(
                today.getMonth() + 1
            ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

            const dbRef = db;

            const productRef = doc(
                dbRef,
                "products",
                user.uid,
                "productList",
                selectedProduct.id
            );

            const marketplaceRef = doc(
                dbRef,
                "marketplaceProducts",
                selectedProduct.id
            );

            const dailyRef = doc(
                dbRef,
                "dashboardStats",
                user.uid,
                "daily",
                todayKey
            );

            const salesRef = doc(
                collection(dbRef, "sales", user.uid, "userSales")
            );

            await runTransaction(dbRef, async (tx) => {
                // 🔍 Check stock first
                const productSnap = await tx.get(productRef);

                if (!productSnap.exists()) {
                    throw new Error("Product not found");
                }

                const currentQty = productSnap.data().quantity || 0;

                if (currentQty < 1) {
                    throw new Error("Out of stock");
                }

                /* 1️⃣ Save sale */
                tx.set(salesRef, {
                    uid: user.uid,
                    items: [
                        {
                            productId: selectedProduct.id,
                            name: selectedProduct.name,
                            quantity: 1,
                            sellingPrice: editedPrice,
                            costPrice: selectedProduct.costPrice || 0,
                            profit,
                            total: editedPrice,
                            department: selectedProduct.department || "",
                        },
                    ],
                    totalAmount: editedPrice,
                    totalProfit: profit,
                    createdAt: serverTimestamp(),
                });

                /* 2️⃣ Reduce stock */
                tx.update(productRef, {
                    quantity: increment(-1),
                });

                /* 3️⃣ Update dashboard */
                tx.set(
                    dailyRef,
                    {
                        salesCount: increment(1),
                        revenue: increment(editedPrice),
                        profit: increment(profit),
                        [`topProducts.${selectedProduct.id}.quantity`]: increment(1),
                        [`topProducts.${selectedProduct.id}.revenue`]: increment(editedPrice),
                        [`topProducts.${selectedProduct.id}.name`]: selectedProduct.name,
                        updatedAt: serverTimestamp(),
                    },
                    { merge: true }
                );

                /* 4️⃣ Update marketplace */
                tx.update(marketplaceRef, {
                    sold: increment(1),
                    updatedAt: serverTimestamp(),
                });
            });

            // ✅ UI cleanup
            setSaleModalOpen(false);
            setSelectedProduct(null);

            openConfirm(
                `Sale of "${selectedProduct.name}" completed successfully ✅`
            );
        } catch (err) {
            console.error("Direct sale failed:", err.message);

            openConfirm(err.message || "❌ Unable to complete sale", "error");
        }
    };

    return (
        <DirectSaleContext.Provider
            value={{
                selectedProduct,
                isSaleModalOpen,
                startSale,
                cancelSale,
                confirmSale
            }}
        >
            {children}
        </DirectSaleContext.Provider>
    );
};