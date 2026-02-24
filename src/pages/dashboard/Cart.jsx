import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "./O_DashboardLayout";
import SaleModal from "./SaleModal";
import ProductImageCarousel from "./ProductImageCarousel";
import { useProducts } from "../../context/ProductContext";
import { useCart } from "../../context/CartContext";
import { useSearch } from "../../context/SearchContext";
import { useDirectSale } from "../../context/DirectSaleContext";
import { useCurrency } from "../../context/CurrencyContext";
import { motion, AnimatePresence } from "framer-motion";
import { FaTrash, FaMinus, FaPlus, FaShoppingCart, FaMoneyBillWave } from "react-icons/fa";

export default function Cart() {
  const {
    cartItems,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    checkoutCart,
    addToCart,
  } = useCart();

  const { startSale } = useDirectSale();
  const { currency } = useCurrency();
  const { products } = useProducts();

  const [editedPrices, setEditedPrices] = useState({});
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const { setScope, results } = useSearch();

  // Calculate total
  const totalAmount = cartItems.reduce((sum, item) => {
    const rawPrice = editedPrices[item.id] ?? item.sellingPrice;
    const price = Number(rawPrice) || 0;
    return sum + price * item.quantity;
  }, 0);

  // Handle price edit
  const updatePrice = (id, value) => {
    setEditedPrices((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const searchActive = results.length > 0;
  const displayList = searchActive ? results : products;

  if (searchActive) {
    return (
      <DashboardLayout>
        <div className="">

          <h2 className="md:text-2xl text-lg mt-28 md:mt-0 font-semibold mb-4">Search Results</h2>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
            {displayList.map((product) => {

              const isLowStock = product.quantity > 0 && product.quantity <= 5;
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

                  <h3 className="md:text-lg text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
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
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 mb-12">
        {/* HEADER */}
        <div className="flex justify-between items-center mt-32 md:mt-5">
          <h1 className="md:text-3xl text-xl font-bold text-gray-800 dark:text-white">
            Cart
          </h1>

          {cartItems.length > 0 && (
            <button
              onClick={() => setCheckoutOpen(true)}
              className="md:flex gap-1 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700"
            >
              <span>Checkout </span>
              <span>({currency.symbol}{totalAmount.toLocaleString()})</span>
            </button>
          )}
        </div>

        {/* EMPTY CART */}
        {cartItems.length === 0 && (
          <p className="text-gray-600 dark:text-gray-400 text-lg flex items-center justify-center h-60">
            Your cart is empty.
          </p>
        )}

        {/* CART ITEMS */}
        <div className="space-y-5">
          <AnimatePresence>
            {cartItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl shadow"
              >
                <div>
                  <h3 className="md:text-xl text-sm font-semibold text-gray-800 dark:text-white max-w-24 md:max-w-full line-clamp-2">
                    {item.name}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 md:text-lg text-[12px]">
                    Qty: {item.quantity}
                  </p>
                </div>

                {/* PRICE INPUT */}
                <div className="flex flex-col items-end">
                  <input
                    type="number"
                    value={editedPrices[item.id] ?? String(item.sellingPrice)}
                    onChange={(e) => updatePrice(item.id, e.target.value)}
                    className="w-24 p-2 border rounded dark:bg-gray-900 dark:text-white md:text-lg text-[12px]"
                  />
                  <p className="text-gray-500 dark:text-gray-400 text-[8px]">click on price to edit</p>
                </div>

                {/* QUANTITY BUTTONS */}
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => decreaseQuantity(item.id)}
                    className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded md:text-lg text-[10px]"
                  >
                    <FaMinus />
                  </button>

                  <span className="text-lg text-gray-800 dark:text-white">
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => increaseQuantity(item.id)}
                    className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded md:text-lg text-[10px]"
                  >
                    <FaPlus />
                  </button>
                </div>

                {/* REMOVE BUTTON */}
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <FaTrash />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* ===================== */}
        {/* CHECKOUT MODAL */}
        {/* ===================== */}
        <AnimatePresence>
          {checkoutOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCheckoutOpen(false)}   // 👈 close on outside click
              className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()} // 👈 prevent outside close
                className="bg-white dark:bg-gray-900 p-6 rounded-2xl w-full max-w-md shadow-xl"
              >
                <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white">
                  Confirm Checkout
                </h2>

                {/* ORDER SUMMARY */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {cartItems.map((item) => {
                    const price = Number(editedPrices[item.id] ?? item.sellingPrice) || 0;

                    return (
                      <div
                        key={item.id}
                        className="flex justify-between border-b pb-2 text-gray-800 dark:text-gray-200"
                      >
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>{currency.symbol}{(price * item.quantity).toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>

                {/* TOTAL */}
                <p className="text-xl font-bold mt-4 text-gray-900 dark:text-white">
                  Total: {currency.symbol}{totalAmount.toLocaleString()}
                </p>

                {/* BUTTONS */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setCheckoutOpen(false)}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-700 rounded"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => {
                      const numericPrices = {};

                      Object.keys(editedPrices).forEach((id) => {
                        numericPrices[id] = Number(editedPrices[id]) || 0;
                      });

                      checkoutCart(numericPrices);
                      setCheckoutOpen(false);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </DashboardLayout>
  );
}
