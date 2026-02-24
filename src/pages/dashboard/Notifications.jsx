import { useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config.js"; 
import { useNotification } from "../../context/NotificationContext";
import O_DashboardLayout from "./O_DashboardLayout.jsx";
import SaleModal from "./SaleModal.jsx";
import { useSearch } from "../../context/SearchContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useDirectSale } from "../../context/DirectSaleContext.jsx";
import { useCurrency } from "../../context/CurrencyContext.jsx";
import { motion } from "framer-motion";
import { FaMoneyBillWave, FaShoppingCart } from "react-icons/fa";
import ProductImageCarousel from "./ProductImageCarousel.jsx";

export default function Notifications() {
const [products, setProducts] = useState([]);

  const { notifications, markAsRead, markAllAsRead, clearAllNotifications } = useNotification();
  const { results } = useSearch();
  const { addToCart } = useCart();
  const { startSale } = useDirectSale();
  const { currency } = useCurrency();

  // Fetch Products
  const getProducts = async (uid) => {
    try {
      const q = query(collection(db, "products"), where("uid", "==", uid));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setProducts(list);
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  };

  const searchActive = results.length > 0;
  const displayList = searchActive ? results : products;

    if (searchActive) {
      return (
        <O_DashboardLayout>
          <div className="">
  
            <h2 className="md:text-2xl text-lg mt-24 md:mt-0 font-semibold mb-4">Search Results</h2>
  
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {displayList.map((product) => {
  
                const isLowStock = product.quantity > 0 && product.quantity < 5;
                const isOut = product.quantity === 0;
  
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-md p-1 
                              transition ${isOut ? "opacity-80" : "hover:shadow-lg"} cursor-pointer`}
                  >
  
                    {/* 🔥 LOW STOCK WARNING */}
                    {isLowStock && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold 
                      px-3 py-1 z-30 rounded-full shadow animate-pulse"
                      >
                        Low Stock ({product.quantity})
                      </motion.div>
                    )}
  
                    {/* ❌ OUT OF STOCK ALERT */}
                    {isOut && (
                      <motion.div
                        initial={{ y: -10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold 
                      px-3 py-1 z-30 rounded-full shadow"
                      >
                        Out of Stock
                      </motion.div>
                    )}
  
                    {/* 🖼️ PRODUCT IMAGE */}
                    <div className="">
                      <ProductImageCarousel
                        images={[
                          product.image,
                          product.image2
                        ].filter(Boolean)}
                      />
                    </div>
  
                    <h3 className="md:text-lg text-sm font-semibold text-gray-900 dark:text-white">
                      {product.name}
                    </h3>
  
                    <div className="mt-1">
                      <p className="md:text-sm text-xs mb-1">Quantity: {product.quantity}</p>
                      <p className="text-sm font-semibold">{currency.symbol}{product.sellingPrice.toLocaleString()}</p>
                    </div>
  
                    {/* 🔘 BUTTONS OR OUT OF STOCK ALERT */}
                    <div className="flex justify-between mt-1 flex-wrap gap-1">
  
                      {isOut ? (
                        // 🔴 Animated out of stock message
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.7 }}
                          className="w-full text-center bg-red-600 text-white py-2 rounded-lg font-semibold"
                        >
                          Out of Stock
                        </motion.div>
                      ) : (
                        <>
                          <button
                            onClick={() => addToCart(product)}
                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 
                          text-white md:text-sm text-xs md:px-3 px-[6px] md:py-3 py-[6px] rounded-lg"
                          >
                            <FaShoppingCart /> Add
                          </button>
  
                          <button
                            onClick={() => startSale(product)}
                            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 
                          text-white md:text-sm text-xs md:px-3 px-[6px] md:py-3 py-[6px] rounded-lg"
                          >
                            <FaMoneyBillWave /> Sell
                          </button>
                        </>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
  
          <SaleModal />
        </O_DashboardLayout>
      )
    }

  return (
    <O_DashboardLayout>
      <div className="md:mt-1 mt-32">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-semibold">Notifications</h1>
          {notifications.length > 0 && (
            <div className="flex gap-4 flex-wrap justify-end">
              <button
                onClick={markAllAsRead}
                className="text-blue-600 hover:underline md:text-lg text-sm"
              >
                Mark all as read
              </button>
              <button className="text-red-500 md:text-lg text-sm hover:underline" onClick={clearAllNotifications}>
                Clear all
              </button>
            </div>
          )}
        </div>
        {notifications.length === 0 && (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No notifications yet.
          </p>
        )}
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-4 rounded-lg border cursor-pointer ${!n.read
                ? "bg-blue-50 dark:bg-blue-900 border-blue-200"
                : "bg-white dark:bg-gray-800"
                }`}
            >
              <p className="text-gray-800 dark:text-gray-200">{n.message}</p>
              <span className="text-xs text-gray-500">
                {n.createdAt?.toDate().toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </O_DashboardLayout>
  );
}
