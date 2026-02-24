import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { auth, db } from "../../firebase/config";
import ProductImageCarousel from "./ProductImageCarousel";
import EnyotronicsLogo from "../../images/enyotronics-logo.png";
import * as htmlToImage from "html-to-image";
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  where,
  Timestamp,
} from "firebase/firestore";

import DashboardLayout from "./O_DashboardLayout";
import SaleModal from "./SaleModal";

import {
  FaCalendarAlt,
  FaShoppingCart,
  FaMoneyBillWave,
  FaFileAlt,
  FaShareAlt,
  FaPrint,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";

import { useSearch } from "../../context/SearchContext";
import { useCart } from "../../context/CartContext";
import { useDirectSale } from "../../context/DirectSaleContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useProducts } from "../../context/ProductContext";

const PAGE_SIZE = 20;
const CACHE_KEY = "sales_cache_v1";

/* ===============================
   DATE RANGE HELPER
================================*/
const getDateRange = (range, startDate, endDate) => {
  const now = new Date();
  let start, end;

  end = new Date();
  end.setHours(23, 59, 59, 999);

  switch (range) {
    case "today":
      start = new Date();
      start.setHours(0, 0, 0, 0);
      break;
    case "week":
      start = new Date();
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      break;
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "custom":
      start = startDate ? new Date(startDate + "T00:00:00") : new Date("2000-01-01");
      end = endDate ? new Date(endDate + "T23:59:59.999") : end;
      break;
    default:
      start = new Date("2000-01-01");
  }

  return { start, end };
};

/* ===============================
   RECEIPT COMPONENT
   Separate component so ref works
================================*/
const Receipt = React.forwardRef(({ sale, currency, profile, logoSrc }, ref) => {
  if (!sale) return null;

  const saleDate = sale.createdAt?.toDate
    ? sale.createdAt.toDate()
    : new Date(sale.createdAt?.seconds * 1000);

  const subtotal = sale.items.reduce(
    (sum, item) => sum + item.quantity * (item.sellingPrice || item.price || 0),
    0
  );

  return (
    <div
      ref={ref}
      style={{
        width: "320px",
        backgroundColor: "#ffffff",
        fontFamily: "'Courier New', Courier, monospace",
        padding: "24px 20px",
        color: "#111111",
        boxSizing: "border-box",
      }}
    >
      {/* ---- HEADER ---- */}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
       
        <div style={{ fontSize: "16px", fontWeight: "800", letterSpacing: "2px", textTransform: "uppercase" }}>
          {profile?.business?.businessName || "My Business"}
        </div>
        <div style={{ fontSize: "11px", marginTop: "4px", color: "#555" }}>
          {profile?.business?.businessType || ""}
        </div>
        {profile?.business?.businessAddress && (
          <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
            {profile.business.businessAddress}
          </div>
        )}
        {profile?.business?.location?.city && (
          <div style={{ fontSize: "11px", color: "#555" }}>
            {profile.business.location.city}, {profile.business.location.state}
          </div>
        )}
        {profile?.admin?.phone?.full && (
          <div style={{ fontSize: "11px", color: "#555", marginTop: "2px" }}>
            Tel: {profile.admin.phone.full}
          </div>
        )}
      </div>

      {/* ---- DIVIDER ---- */}
      <div style={{ borderTop: "2px dashed #ccc", margin: "12px 0" }} />

      {/* ---- RECEIPT META ---- */}
      <div style={{ fontSize: "11px", marginBottom: "12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#555" }}>Receipt #:</span>
          <span style={{ fontWeight: "700" }}>{sale.id?.slice(-10).toUpperCase()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <span style={{ color: "#555" }}>Date:</span>
          <span>{saleDate.toLocaleDateString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <span style={{ color: "#555" }}>Time:</span>
          <span>{saleDate.toLocaleTimeString()}</span>
        </div>
        
        {sale.cashierName && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
            <span style={{ color: "#555" }}>Cashier:</span>
            <span>{sale.cashierName}</span>
          </div>
        )}
      </div>

      {/* ---- DIVIDER ---- */}
      <div style={{ borderTop: "2px dashed #ccc", margin: "12px 0" }} />

      {/* ---- ITEMS HEADER ---- */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "10px",
          fontWeight: "700",
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: "#555",
          marginBottom: "8px",
          borderBottom: "2px solid #111",
        }}
      >
        <span style={{ flex: 2 }}>Item</span>
        <span style={{ flex: 1, textAlign: "center" }}>Qty</span>
        <span style={{ flex: 1, textAlign: "right" }}>Rate</span>
        <span style={{ flex: 1, textAlign: "right" }}>Amount</span>
      </div>

      {/* ---- ITEMS ---- */}
      {sale.items.map((item, i) => {
        const price = item.sellingPrice || item.price || 0;
        const lineTotal = item.quantity * price;

        return (
          <div
            key={i}
            style={{
              marginBottom: "10px",
              paddingBottom: "8px",
              borderBottom: "2px dotted #e0e0e0",
            }}
          >
            
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "11px",
                color: "#333",
                orderBottom: "1px dotted #e0e0e0",
              }}
            >
              <span style={{ flex: 2, fontSize: "12px", fontWeight: "600", }}>{item.name}</span>
              <span style={{ flex: 1, textAlign: "center" }}>{item.quantity}</span>
              <span style={{ flex: 1, textAlign: "right" }}>
                {currency.symbol}{price.toLocaleString()}
              </span>
              <span style={{ flex: 1, textAlign: "right", fontWeight: "600" }}>
                {currency.symbol}{lineTotal.toLocaleString()}
              </span>
            </div>
          </div>
        );
      })}

      {/* ---- SUBTOTAL / TOTAL ---- */}
      <div style={{ borderTop: "2px dashed #ccc", margin: "12px 0 8px" }} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          marginBottom: "6px",
          color: "#555",
        }}
      >
        <span>Subtotal</span>
        <span>{currency.symbol}{subtotal.toLocaleString()}</span>
      </div>

      {sale.discount > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            marginBottom: "6px",
            color: "#e53e3e",
          }}
        >
          <span>Discount</span>
          <span>-{currency.symbol}{sale.discount.toLocaleString()}</span>
        </div>
      )}

      <div style={{ borderTop: "2px solid #111", margin: "8px 0" }} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "15px",
          fontWeight: "800",
          letterSpacing: "0.5px",
        }}
      >
        <span>TOTAL</span>
        <span>
          {currency.symbol}{sale.totalAmount?.toLocaleString()}
        </span>
      </div>

      {/* ---- PAYMENT METHOD ---- */}
      {sale.paymentMethod && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "11px",
            marginTop: "8px",
            color: "#555",
          }}
        >
          <span>Payment:</span>
          <span style={{ textTransform: "capitalize" }}>{sale.paymentMethod}</span>
        </div>
      )}

      {/* ---- DIVIDER ---- */}
      <div style={{ borderTop: "2px dashed #ccc", margin: "16px 0 12px" }} />

      {/* ---- FOOTER ---- */}
      <div style={{ textAlign: "center", fontSize: "11px", color: "#555" }}>
        <div style={{ marginBottom: "4px" }}>Thank you for your patronage! 🙏</div>
        <div style={{ marginBottom: "8px", fontStyle: "italic" }}>
          Items sold are not returnable.
        </div>
        <div
          style={{
            fontSize: "9px",
            color: "#999",
            borderTop: "1px solid #eee",
            paddingTop: "8px",
          }}
        >
          Powered by
          <img
            src={EnyotronicsLogo}
            alt="Enyotronics"
            style={{ width: "60px", display: "block", margin: "4px auto 0" }}
            crossOrigin="anonymous"
          />
        </div>
      </div>
    </div>
  );
});

Receipt.displayName = "Receipt";

/* ===============================
   RECEIPT MODAL COMPONENT
================================*/
function ReceiptModal({ sale, currency, profile, logoSrc, onClose }) {
  const receiptRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);

  // 🔥 Share as Image — uses Web Share API if available, falls back to download
  const handleShareImage = async () => {
    if (!receiptRef.current) return;
    setSharing(true);

    try {
      const dataUrl = await htmlToImage.toPng(receiptRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 3,
        // Ensures full height is captured
        style: {
          transform: "none",
          overflow: "visible",
        },
      });

      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `receipt-${sale.id?.slice(-8)}.png`, {
        type: "image/png",
      });

      // Try Web Share API first (works on mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Receipt - ${profile?.business?.businessName || "Sales Receipt"}`,
          text: `Sales receipt for ${sale.totalAmount ? `${currency.symbol}${sale.totalAmount.toLocaleString()}` : ""}`,
          files: [file],
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      } else {
        // Fallback: download the image
        const link = document.createElement("a");
        link.download = `receipt-${sale.id?.slice(-8)}.png`;
        link.href = dataUrl;
        link.click();
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Share failed:", err);
        alert("Could not share receipt. Please try again.");
      }
    } finally {
      setSharing(false);
    }
  };

  // 🔥 Print as PDF — renders receipt in a clean print window
  const handlePrintPDF = async () => {
    if (!receiptRef.current) return;
    setPrinting(true);

    try {
      const dataUrl = await htmlToImage.toPng(receiptRef.current, {
        backgroundColor: "#ffffff",
        pixelRatio: 3,
        style: {
          transform: "none",
          overflow: "visible",
        },
      });

      const printWindow = window.open("", "_blank", "width=400,height=700");
      if (!printWindow) {
        alert("Please allow popups to print the receipt.");
        return;
      }

      const saleDate = sale.createdAt?.toDate
        ? sale.createdAt.toDate()
        : new Date(sale.createdAt?.seconds * 1000);

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${sale.id?.slice(-10).toUpperCase()}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                display: flex;
                justify-content: center;
                align-items: flex-start;
                min-height: 100vh;
                background: #f5f5f5;
                padding: 20px;
              }
              img.receipt-img {
                max-width: 320px;
                width: 100%;
                display: block;
                box-shadow: 0 2px 12px rgba(0,0,0,0.15);
              }
              @media print {
                body {
                  background: white;
                  padding: 0;
                  display: block;
                }
                img.receipt-img {
                  max-width: 100%;
                  box-shadow: none;
                }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div>
              <img class="receipt-img" src="${dataUrl}" alt="Receipt" />
              <div class="no-print" style="text-align:center; margin-top: 16px;">
                <button
                  onclick="window.print()"
                  style="
                    padding: 10px 28px;
                    background: #1d4ed8;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                  "
                >
                  🖨️ Print / Save as PDF
                </button>
              </div>
            </div>
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      // Auto-trigger print after image loads
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    } catch (err) {
      console.error("Print failed:", err);
      alert("Could not prepare receipt for printing.");
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">Receipt Preview</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                #{sale.id?.slice(-10).toUpperCase()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <FaTimes className="text-gray-500" />
            </button>
          </div>

          {/* Receipt Preview — scrollable */}
          <div className="overflow-y-auto max-h-[55vh] flex justify-center bg-gray-50 py-4 px-4">
            <div className="shadow-md rounded">
              <Receipt
                ref={receiptRef}
                sale={sale}
                currency={currency}
                profile={profile}
                logoSrc={logoSrc}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-5 py-4 border-t border-gray-100 space-y-3">
            {/* Share as Image */}
            <button
              onClick={handleShareImage}
              disabled={sharing}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition ${
                shareSuccess
                  ? "bg-green-500 text-white"
                  : sharing
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 text-white shadow-sm shadow-green-200"
              }`}
            >
              {sharing ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Generating Image...
                </>
              ) : shareSuccess ? (
                <>✅ Image Saved!</>
              ) : (
                <>
                  <FaShareAlt />
                  Share as Image
                </>
              )}
            </button>

            {/* Print PDF */}
            <button
              onClick={handlePrintPDF}
              disabled={printing}
              className={`w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition ${
                printing
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200"
              }`}
            >
              {printing ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Preparing PDF...
                </>
              ) : (
                <>
                  <FaPrint />
                  Print / Save as PDF
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ===============================
   MAIN COMPONENT
================================*/
export default function SalesHistory() {
  const [sales, setSales] = useState(() => {
    const cache = localStorage.getItem(CACHE_KEY);
    return cache ? JSON.parse(cache) : [];
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // 🔥 Receipt modal state
  const [receiptSale, setReceiptSale] = useState(null);

  const [filters, setFilters] = useState({
    range: "all",
    startDate: "",
    endDate: "",
  });

  const { setScope, results } = useSearch();
  const { addToCart } = useCart();
  const { startSale } = useDirectSale();
  const { currency } = useCurrency();
  const { products, profile } = useProducts();

  useEffect(() => {
    setScope("all-products");
  }, []);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) resetAndFetch(user.uid);
      else setSales([]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) resetAndFetch(user.uid);
  }, [filters]);

  const resetAndFetch = async (uid) => {
    localStorage.removeItem(CACHE_KEY);
    setSales([]);
    setLastDoc(null);
    setHasMore(true);
    await fetchSales(uid, false);
  };

  const fetchSales = async (uid, nextPage = false) => {
    if (!uid || loadingMore || (!hasMore && nextPage)) return;

    nextPage ? setLoadingMore(true) : setLoading(true);

    try {
      const { start, end } = getDateRange(filters.range, filters.startDate, filters.endDate);
      const startTS = Timestamp.fromDate(start);
      const endTS = Timestamp.fromDate(end);

      let q = query(
        collection(db, "sales", uid, "userSales"),
        where("createdAt", ">=", startTS),
        where("createdAt", "<=", endTS),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      if (nextPage && lastDoc) {
        q = query(
          collection(db, "sales", uid, "userSales"),
          where("createdAt", ">=", startTS),
          where("createdAt", "<=", endTS),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(PAGE_SIZE)
        );
      }

      const snap = await getDocs(q);
      const newData = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        items: doc.data().items || [],
      }));

      setSales((prev) => {
        const updated = nextPage ? [...prev, ...newData] : newData;
        localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        return updated;
      });

      setLastDoc(snap.docs[snap.docs.length - 1] || null);
      setHasMore(snap.docs.length === PAGE_SIZE);
    } catch (err) {
      console.error("Fetch sales error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    const user = auth.currentUser;
    if (user) fetchSales(user.uid, true);
  };

  const searchActive = results.length > 0;
  const displayList = searchActive ? results : products;

  return (
    <DashboardLayout>
      <div className="md:p-6 pt-6 mb-12">

        {/* ========== SEARCH VIEW ========== */}
        {searchActive ? (
          <>
            <h2 className="md:text-2xl text-lg font-semibold mb-4">Search Results</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {displayList.map((product) => {
                const isOut = product.quantity === 0;
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow p-1"
                  >
                    <ProductImageCarousel
                      images={[product.image, product.image2].filter(Boolean)}
                    />
                    <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                    <p>Qty: {product.quantity}</p>
                    <p className="font-semibold">
                      {currency.symbol}{product.sellingPrice.toLocaleString()}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {!isOut && (
                        <>
                          <button onClick={() => addToCart(product)} className="bg-blue-500 text-white px-2 py-1 rounded">
                            <FaShoppingCart />
                          </button>
                          <button onClick={() => startSale(product)} className="bg-green-500 text-white px-2 py-1 rounded">
                            <FaMoneyBillWave />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* ========== FILTERS ========== */}
            <div className="flex flex-col gap-4 mb-6">
              <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200">
                Sales History
              </h2>

              <div className="flex flex-wrap items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border dark:border-slate-700">
                {["today", "week", "month", "all"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilters({ range: r, startDate: "", endDate: "" })}
                    className={`px-3 py-1.5 text-xs md:text-sm rounded-md font-medium transition ${
                      filters.range === r
                        ? "bg-blue-600 text-white shadow"
                        : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {r === "today" ? "Today" : r === "week" ? "This Week" : r === "month" ? "This Month" : "All"}
                  </button>
                ))}

                <div className="hidden md:block h-6 w-px bg-gray-300 dark:bg-gray-600 mx-2" />
                <FaCalendarAlt className="text-gray-500 text-sm md:text-base" />

                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, range: "custom", startDate: e.target.value })}
                  className="border dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-2 py-1 rounded-md text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs md:text-sm text-gray-500">to</span>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, range: "custom", endDate: e.target.value })}
                  className="border dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-2 py-1 rounded-md text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* ========== TABLE ========== */}
            {loading ? (
              <p className="text-center text-sm text-gray-500 mt-10">Loading sales...</p>
            ) : sales.length === 0 ? (
              <p className="text-center text-sm text-gray-500 mt-10">No sales found.</p>
            ) : (
              <>
                <div className="overflow-x-auto rounded-xl shadow border dark:border-slate-700">
                  <table className="w-full bg-white dark:bg-slate-800 text-xs md:text-sm">
                    <thead className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">Item</th>
                        <th className="px-3 py-2 text-center font-semibold">Qty</th>
                        <th className="px-3 py-2 text-center font-semibold">Rate</th>
                        <th className="px-3 py-2 text-center font-semibold">Total</th>
                        <th className="px-3 py-2 text-center font-semibold">Date</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y dark:divide-slate-700">
                      {sales.map((sale) => (
                        <React.Fragment key={sale.id}>
                          <tr
                            onClick={() => setExpandedId(expandedId === sale.id ? null : sale.id)}
                            className="hover:bg-gray-50 cursor-pointer dark:hover:bg-slate-700 transition"
                          >
                            <td className="px-3 py-2 align-top text-gray-800 dark:text-gray-200">
                              {sale.items.map((i, idx) => (
                                <div key={idx} className="line-clamp-3 max-w-[120px] md:max-w-none">
                                  {i.name}
                                </div>
                              ))}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-600 dark:text-gray-300">
                              {sale.items.map((i, idx) => <div key={idx}>{i.quantity}</div>)}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-200">
                              {sale.items.map((i, idx) => (
                                <div key={idx}>{currency.symbol}{(i.sellingPrice || i.price)?.toLocaleString()}</div>
                              ))}
                            </td>
                            <td className="px-2 py-2 text-center font-semibold text-green-600 dark:text-green-400">
                              {currency.symbol}{sale.totalAmount?.toLocaleString()}
                            </td>
                            <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400 whitespace-break-spaces">
                              {sale.createdAt?.toDate
                                ? sale.createdAt.toDate().toLocaleString()
                                : new Date(sale.createdAt?.seconds * 1000).toLocaleString()}
                            </td>
                          </tr>

                          {/* 🔥 EXPANDED ROW — Generate Receipt link */}
                          {expandedId === sale.id && (
                            <tr className="bg-blue-50 dark:bg-slate-700">
                              <td colSpan={5} className="px-4 py-3">
                                <div className="flex items-center justify-end">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReceiptSale(sale);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-600 border border-blue-200 dark:border-slate-500 text-blue-700 dark:text-blue-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 rounded-lg text-sm font-semibold transition shadow-sm"
                                  >
                                    <FaFileAlt className="text-xs" />
                                    Generate Receipt
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ========== PAGINATION ========== */}
                <div className="flex justify-center mt-6">
                  {loadingMore ? (
                    <button disabled className="bg-gray-400 px-5 py-2 rounded-lg text-white text-sm">
                      Loading...
                    </button>
                  ) : hasMore ? (
                    <button
                      onClick={handleLoadMore}
                      className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg text-white text-sm shadow transition"
                    >
                      Load More
                    </button>
                  ) : (
                    <span className="text-sm text-gray-500">No more sales</span>
                  )}
                </div>
              </>
            )}
          </>
        )}

        <SaleModal />
      </div>

      {/* 🔥 RECEIPT MODAL */}
      {receiptSale && (
        <ReceiptModal
          sale={receiptSale}
          currency={currency}
          profile={profile}
          logoSrc={EnyotronicsLogo}
          onClose={() => setReceiptSale(null)}
        />
      )}
    </DashboardLayout>
  );
}