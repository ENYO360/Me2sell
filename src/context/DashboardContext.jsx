import React, {
    createContext,
    useContext,
    useRef,
    useState
} from "react";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/config";

const DashboardContext = createContext();
export const useDashboard = () => useContext(DashboardContext);

// ---------- helpers ----------
const dateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

const buildRangeKeys = (start, end) => {
    const keys = [];
    const cursor = new Date(start);

    while (cursor <= end) {
        keys.push(dateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
    }

    return keys;
};

const getRangeDates = (range) => {
    const today = new Date();
    const end = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
    );

    let start;

    switch (range) {
        case "day":
            start = new Date(end);
            break;

        case "week":
            start = new Date(end);
            start.setDate(end.getDate() - 6);
            break;

        case "month":
            start = new Date(end.getFullYear(), end.getMonth(), 1);
            break;

        case "year":
            start = new Date(end.getFullYear(), 0, 1);
            break;

        default: // all time
            start = new Date(1970, 0, 1);
    }

    return { start, end };
};

// ---------- provider ----------
export const DashboardProvider = ({ children }) => {
    const cache = useRef(new Map());
    const [loading, setLoading] = useState(false);

    const fetchDailyDoc = async (uid, key) => {
        const cacheKey = `${uid}_${key}`;

        if (cache.current.has(cacheKey)) {
            return cache.current.get(cacheKey);
        }

        const ref = doc(db, "dashboardStats", uid, "daily", key);
        const snap = await getDoc(ref);
        const data = snap.exists() ? snap.data() : null;

        cache.current.set(cacheKey, data);
        return data;
    };

    const aggregateRange = async ({ start, end }) => {
        const user = auth.currentUser;
        if (!user) return null;

        const keys = buildRangeKeys(start, end);

        let salesCount = 0;
        let revenue = 0;
        let profit = 0;
        const productTotals = {};

        const dailies = await Promise.all(
            keys.map(key => fetchDailyDoc(user.uid, key))
        );

        // Aggregate Stats
        for (const daily of dailies) {
            if (!daily) continue;

            salesCount += daily.salesCount || 0;
            revenue += daily.revenue || 0;
            profit += daily.profit || 0;

            // Support old + new formats
            const productsMap =
                daily.topProducts ||
                daily.topProduct ||
                {};

            Object.entries(productsMap).forEach(([id, info]) => {
                if (!info) return;

                const name =
                    info.name ||
                    info.productName ||
                    id; // fallback for old data

                if (!productTotals[id]) {
                    productTotals[id] = {
                        name,
                        quantity: 0,
                        revenue: 0,
                    };
                }

                productTotals[id].quantity += Number(info.quantity || 0);
                productTotals[id].revenue += Number(info.revenue || 0);
            });
        }

        const topProductEntry =
            Object.entries(productTotals).sort(
                (a, b) => b[1].quantity - a[1].quantity
            )[0];

        const topProduct = topProductEntry
            ? {
                id: topProductEntry[0],
                name: topProductEntry[1].name,   // ✅ USE REAL NAME
                quantity: topProductEntry[1].quantity,
                revenue: topProductEntry[1].revenue
            }
            : null;

        return {
            salesCount,
            salesAmount: revenue,
            profitAmount: profit,
            topProduct
        };
    };

    // ---------- PUBLIC API ----------
    const getStatsByRange = async (range) => {
        setLoading(true);
        const dates = getRangeDates(range);
        const result = await aggregateRange(dates);
        setLoading(false);
        return result;
    };

    const getStatsByCustomRange = async (start, end) => {
        setLoading(true);
        const result = await aggregateRange({ start, end });
        setLoading(false);
        return result;
    };

    return (
        <DashboardContext.Provider
            value={{
                getStatsByRange,
                getStatsByCustomRange,
                loading
            }}
        >
            {children}
        </DashboardContext.Provider>
    );
};
