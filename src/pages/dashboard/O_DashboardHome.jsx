import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EnyotronicsLogo from "../../images/enyotronics-logo.png";
import { useSearch } from "../../context/SearchContext";
import { useCart } from "../../context/CartContext";
import { useDirectSale } from "../../context/DirectSaleContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useProducts } from "../../context/ProductContext";
import { FaShoppingCart, FaCashRegister } from "react-icons/fa";
import ProductImageCarousel from "./ProductImageCarousel";
import DashboardLayout from "./O_DashboardLayout";
import SaleModal from "./SaleModal";
import { motion } from "framer-motion";

export default function DashboardHome() {
  const { products, loading } = useProducts();
  const { setScope } = useSearch();
  const { results } = useSearch();
  const { addToCart } = useCart();
  const { startSale } = useDirectSale();
  const { currency } = useCurrency();

  useEffect(() => {
    setScope("all-products");
  }, []);

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  const listToRender = (results.length > 0 ? results : products)
    .slice() // clone array to avoid mutation
    .sort((a, b) => a.name.localeCompare(b.name));


  return (
    <DashboardLayout>
      <div className="md:p-6 pt-6 mb-8">
        <h2 className="md:text-2xl font-semibold mb-4 dark:text-gray-400">Available Products</h2>

        {loading ? (
          <p className="text-center mt-10 text-gray-500">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-center mt-10 text-gray-500">No products found.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4 md:mt-2">
            {listToRender.map((product) => {

              const isLowStock = product.quantity > 0 && product.quantity <= 5;
              const isOut = product.quantity === 0;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-md p-1 
          transition ${isOut ? "opacity-80" : "hover:shadow-lg"}`}
                >

                  {/* 🔥 LOW STOCK WARNING */}
                  {isLowStock && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="absolute top-0 right-2 bg-yellow-400 text-black md:text-xs text-[10px] font-bold 
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
                      className="absolute top-0 right-2 bg-red-500 text-white md:text-xs text-[10px] font-bold 
                        px-3 py-1 z-30 rounded-full shadow"
                    >
                      Out of Stock
                    </motion.div>
                  )}

                  <ProductImageCarousel
                    images={[
                      product.image,
                      product.image2
                    ].filter(Boolean)}
                  />

                  <h3 className="md:text-lg text-xs font-bold my-1 text-gray-900 dark:text-gray-400 line-clamp-2">
                    {product.name}
                  </h3>

                  <div className="mt-1 dark:text-gray-500">
                    <p className="md:text-sm text-[10px]">Quantity: {product.quantity}</p>
                    <p className="md:text-sm text-[12px] font-semibold">{currency.symbol}{product.sellingPrice.toLocaleString()}</p>
                  </div>

                  {/* 🔘 BUTTONS OR OUT OF STOCK ALERT */}
                  <div className="flex justify-between mt-1">

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
                          onClick={() => handleAddToCart(product)}
                          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 
                text-white md:px-3 px-1 md:py-2 py-1 rounded-lg md:text-sm text-[10px] font-semibold"
                        >
                          <FaShoppingCart /> Add
                        </button>

                        <button
                          onClick={() => startSale(product)}
                          className="flex items-center gap-2 bg-green-500 hover:bg-green-600 
                text-white md:px-3 px-1 md:py-2 py-1 rounded-lg md:text-sm text-[10px] font-semibold"
                        >
                          <FaCashRegister /> Sell
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

        )}
      </div>
      <SaleModal />
    </DashboardLayout>
  );
}
