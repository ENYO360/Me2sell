// --- FIXED CartContext ---
import React, { createContext, useContext, useEffect, useState } from "react";
import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    updateDoc,
    getDoc,
    getDocs,
    addDoc,
    serverTimestamp,
    increment,
    writeBatch
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../firebase/config";
import { useNotification } from "./NotificationContext";
import { useConfirmModal } from "./ConfirmationContext";
import { useCurrency } from "./CurrencyContext";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [user, setUser] = useState(null);
    const { notify } = useNotification();
    const { openConfirm } = useConfirmModal();
    const { currency } = useCurrency();

    const getTodayKey = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
            d.getDate()
        ).padStart(2, "0")}`;
    };


    // 🟢 Watch auth and sync cart
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (!currentUser) {
                setCartItems([]);
                return;
            }

            const snap = await getDocs(
                collection(db, "users", currentUser.uid, "cart")
            );

            setCartItems(
                snap.docs.map((d) => ({ id: d.id, ...d.data() }))
            );
        });

        return () => unsub();
    }, []);

    // 🟢 Add to Cart
    const addToCart = async (product) => {
        if (!user) return alert("Please log in first.");

        const ref = doc(db, "users", user.uid, "cart", product.id);
        await setDoc(
            ref,
            {
                productId: product.id,
                name: product.name,
                sellingPrice: product.sellingPrice,
                costPrice: product.costPrice || 0,
                quantity: increment(1),
                departmentId: product.departmentId || "",
                createdAt: serverTimestamp(),
            },
            { merge: true }
        );

        // 🔥 LOCAL STATE UPDATE
        setCartItems((prev) => {
            const existing = prev.find((i) => i.id === product.id);

            if (existing) {
                return prev.map((i) =>
                    i.id === product.id
                        ? { ...i, quantity: i.quantity + 1 }
                        : i
                );
            }

            return [
                ...prev,
                {
                    id: product.id,
                    productId: product.id,           // 🔥 REQUIRED
                    name: product.name,
                    sellingPrice: Number(product.sellingPrice),
                    costPrice: Number(product.costPrice || 0),
                    quantity: 1,
                    departmentId: product.departmentId || "",
                },
            ];
        });

        openConfirm(`"${product.name}" added to cart.`, { autoClose: 1000 });
    };

    // 🟢 Increase qty
    const increaseQuantity = async (id) => {
        if (!user) return;

        await updateDoc(
            doc(db, "users", user.uid, "cart", id),
            { quantity: increment(1) }
        );

        setCartItems((prev) =>
            prev.map((i) =>
                i.id === id ? { ...i, quantity: i.quantity + 1 } : i
            )
        );
    };

    // 🟢 Decrease qty
    const decreaseQuantity = async (id) => {
        if (!user) return;

        const item = cartItems.find((i) => i.id === id);
        if (!item) return;

        if (item.quantity <= 1) {
            await deleteDoc(doc(db, "users", user.uid, "cart", id));
            setCartItems((prev) => prev.filter((i) => i.id !== id));
        } else {
            await updateDoc(
                doc(db, "users", user.uid, "cart", id),
                { quantity: increment(-1) }
            );

            setCartItems((prev) =>
                prev.map((i) =>
                    i.id === id ? { ...i, quantity: i.quantity - 1 } : i
                )
            );
        }
    };

    // 🟢 Remove item
    const removeFromCart = async (id) => {
        if (!user) return;

        await deleteDoc(doc(db, "users", user.uid, "cart", id));
        setCartItems((prev) => prev.filter((i) => i.id !== id));
    };

    // 🟢 Clear entire cart
    const clearCart = async () => {
        if (!user || cartItems.length === 0) return;

        const batch = writeBatch(db);

        cartItems.forEach((item) => {
            batch.delete(
                doc(db, "users", user.uid, "cart", item.id)
            );
        });

        await batch.commit();
        setCartItems([]);
    };

    // 🧾 🟢 Checkout
    const checkoutCart = async (editedPrices = {}) => {
        if (!user) return alert("Login first.");
        if (cartItems.length === 0) return alert("Cart empty.");

        try {
            const todayKey = getTodayKey();
            // sales path
            const salesRef = collection(db, "sales", user.uid, "userSales");
            const dailyRef = doc(db, "dashboardStats", user.uid, "daily", todayKey);

            // Build items array
            const items = cartItems.map((item) => {
                const price = Number(
                    editedPrices[item.id] ?? item.sellingPrice
                );

                return {
                    productId: item.productId,
                    name: item.name,
                    sellingPrice: price,
                    quantity: item.quantity,
                    total: price * item.quantity,
                    costPrice: Number(item.costPrice || 0),
                    profit: price - Number(item.costPrice || 0),
                    departmentId: item.departmentId || "",
                };
            });

            const totalAmount = items.reduce(
                (sum, item) => sum + item.total,
                0
            );

            // Create sale record (inside correct user path)
            await addDoc(salesRef, {
                uid: user.uid,
                items,
                totalAmount,
                createdAt: serverTimestamp(),
            });

            // Update each product stock
            const batch = writeBatch(db);

            items.forEach(item => {
                const ref = doc(db, "products", user.uid, "productList", item.productId);
                batch.update(ref, {
                    quantity: increment(-item.quantity),
                });
            });

            // Update daily dashboard stats
            const totalProfit = items.reduce(
                (sum, i) => sum + i.profit * i.quantity,
                0
            );

            const dailySnap = await getDoc(dailyRef);
            const prev = dailySnap.exists() ? dailySnap.data() : {};

            const topProducts = { ...(prev.topProducts || {}) };

            items.forEach((item) => {
                if (!topProducts[item.name]) {
                    topProducts[item.name] = { quantity: 0, revenue: 0 };
                }

                topProducts[item.name].quantity += item.quantity;
                topProducts[item.name].revenue += item.total;
            });

            batch.set(
                dailyRef,
                {
                    salesCount: (prev.salesCount || 0) + items.reduce((s, i) => s + i.quantity, 0),
                    revenue: (prev.revenue || 0) + totalAmount,
                    profit: (prev.profit || 0) + totalProfit,
                    topProducts,
                    updatedAt: serverTimestamp()
                },
                { merge: true }
            );

            await batch.commit();

            openConfirm("Sale(s) completed successfully!");

            await clearCart();
        } catch (err) {
            console.error("Checkout failed:", err);
            alert("❌ Error completing checkout.");
        }
    };

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                increaseQuantity,
                decreaseQuantity,
                clearCart,
                checkoutCart,
                user,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};
