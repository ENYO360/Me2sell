import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "./O_DashboardLayout.jsx";
import SaleModal from "./SaleModal.jsx";
import ProductImageCarousel from "./ProductImageCarousel.jsx";
import { db, auth } from "../../firebase/config";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../../context/SearchContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useDirectSale } from "../../context/DirectSaleContext.jsx";
import { useCurrency } from "../../context/CurrencyContext.jsx";
import { useProducts } from "../../context/ProductContext.jsx";
import { useDashboard } from "../../context/DashboardContext.jsx";
import { motion } from "framer-motion";
import {
  FaShoppingCart,
  FaBox,
  FaMoneyBillWave,
  FaHistory,
  FaTrophy
} from "react-icons/fa";

// TIME RANGE HELPER

export default function Overview() {
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    salesRange: "day",
  });

  const [stats, setStats] = useState(null);
  const [customMode, setCustomMode] = useState(false);
  const [customRange, setCustomRange] = useState({
    start: "",
    end: ""
  });

  const { results, setScope } = useSearch();
  const { addToCart } = useCart();
  const { startSale } = useDirectSale();
  const { currency } = useCurrency();
  const { products } = useProducts();
  const { getStatsByRange, getStatsByCustomRange, loading } = useDashboard();

  useEffect(() => {
    setScope("all-products");
  }, []);

  // Fetch dashboard Stats on load
  useEffect(() => {
    const loadStats = async () => {
      const result = await getStatsByRange(filters.salesRange);
      setStats(result);
      setCustomMode(false);
    };

    loadStats();
  }, [filters.salesRange]);


  const applyCustomFilter = async () => {
    if (!customRange.start || !customRange.end) return;

    const start = new Date(customRange.start);
    const end = new Date(customRange.end);

    const diffDays =
      (end - start) / (1000 * 60 * 60 * 24);

    if (diffDays > 90) {
      alert("Please select a range of 90 days or less");
      return;
    }

    const result = await getStatsByCustomRange(start, end);
    setStats(result);
    setCustomMode(true);
  };

  const inStock = products.filter(p => p.quantity > 0).length;
  const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= 5).length;
  const outOfStock = products.filter(p => p.quantity === 0).length;
  const inStockAmount = products
  .filter(p => Number(p.quantity) > 0)
  .reduce(
    (sum, p) => sum + (Number(p.quantity) * Number(p.sellingPrice || 0)),
    0
  );

  const dashboard = stats ?? {
  salesCount: 0,
  salesAmount: 0,
  profitAmount: 0,
  topProduct: null,
    inStock,
    lowStock,
    outOfStock,
    inStockAmount
  };

  const ranges = [
    { value: "day", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
  ];

  const searchActive = results.length > 0;
  const displayList = searchActive ? results : products;

  if (searchActive) {
    return (
      <DashboardLayout>
        <div className="">

          <h2 className="md:text-2xl text-lg mt-28 md:mt-0 font-semibold mb-4">Search Results</h2>

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

        <h1 className="md:text-3xl text-xl font-bold text-gray-800 dark:text-white mt-32 md:mt-10">
          Overview
        </h1>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-sm text-gray-500">Start Date</label>
            <input
              type="date"
              className="block bg-gray-200 dark:bg-gray-700 rounded px-2 py-1"
              value={customRange.start}
              onChange={e => setCustomRange({ ...customRange, start: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm text-gray-500">End Date</label>
            <input
              type="date"
              className="block bg-gray-200 dark:bg-gray-700 rounded px-2 py-1"
              value={customRange.end}
              onChange={e => setCustomRange({ ...customRange, end: e.target.value })}
            />
          </div>

          <button
            onClick={applyCustomFilter}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {loading ? "Loading..." : "Apply"}
          </button>

          {customMode && (
            <button
              onClick={async () => {
                const result = await getStatsByRange(filters.salesRange);
                setStats(result);
                setCustomMode(false);
              }}
              className="text-sm text-red-500 underline"
            >
              Exit Custom Mode
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex items-center gap-4">
          <label className="text-sm text-gray-500">View Range</label>

          <select
            value={filters.salesRange}
            onChange={(e) =>
              setFilters({ ...filters, salesRange: e.target.value })
            }
            className="bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded"
          >
            {ranges.map(r => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* ----- STAT CARDS ----- */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {/* TOTAL SALES */}
          <StatCard
            icon={<FaShoppingCart className="md:text-4xl text-xl text-green-500" />}
            title="Total Sales"
            count={dashboard.salesCount}
            amount={dashboard.salesAmount}
            filter={filters.salesRange}
            currency={currency}
          />

          {/* TOTAL PROFIT */}
          <StatCard
            icon={<FaMoneyBillWave className="md:text-4xl text-xl text-yellow-500" />}
            title="Total Profit"
            count={""}
            amount={dashboard.profitAmount}
            currency={currency}
          />

          {/* TOP PRODUCT */}
          <TopProductCard
            icon={<FaTrophy className="md:text-4xl text-xl text-purple-500" />}
            top={dashboard.topProduct}
            currency={currency}
          />

          <div onClick={() => { navigate("/dashboard/products") }}>
            <StatCard
              icon={<FaBox className="md:text-4xl text-xl text-blue-500" />}
              title="Products In Stock"
              count={inStock}
              amount={inStockAmount}
              currency={currency}
              disableFilter={true}
            />
          </div>

          <div onClick={() => { navigate("/dashboard/products") }}>
            <StatCard
              icon={<FaHistory className="md:text-4xl text-xl text-yellow-500" />}
              title="Low Stock Products"
              count={lowStock}
              amount={""}
              hideAmount={true}
              disableFilter={true}
            />
          </div>

          <div onClick={() => { navigate("/dashboard/products") }}>
            <StatCard
              icon={<FaShoppingCart className="md:text-4xl text-xl text-red-500" />}
              title="Out of Stock"
              count={outOfStock}
              amount={""}
              hideAmount={true}
              disableFilter={true}
            />
          </div>
        </div>
      </div>

      <SaleModal />
    </DashboardLayout>
  );
}

const StatCard = ({
  icon,
  title,
  count,
  amount,
  filter,
  setFilter,
  ranges,
  hideAmount = false,
  disableFilter = false,
  currency,
  onClick
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="p-5 h-full rounded-xl shadow bg-white dark:bg-gray-800"
  >
    <div className="flex justify-between">{icon}</div>

    <p className="text-gray-500 text-sm md:text-lg dark:text-gray-300 mb-3">{title}</p>

    <h2 className="md:text-xl text-sm font-bold text-gray-800 dark:text-white">
      {count && `${count} `}
    </h2>

    {!hideAmount && (
      <p className="md:text-2xl text-lg font-semibold text-green-600 dark:text-green-400">
        {currency?.symbol}{Number(amount || 0).toLocaleString()}
      </p>
    )}
  </motion.div>
);

const TopProductCard = ({ icon, top, currency }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="p-5 rounded-xl shadow bg-white dark:bg-gray-800"
  >
    <div className="flex justify-between">{icon}</div>

    <p className="text-gray-500 text-sm md:text-lg dark:text-gray-300 mb-3">Top Selling Product</p>

    {!top ? (
      <h2 className="text-md text-gray-400 mt-2">No sales in this range</h2>
    ) : (
      <>
        <h2 className="md:text-xl font-bold text-gray-800 dark:text-white">
          {top.name}
        </h2>

        <p className="text-gray-600 dark:text-gray-300">
          Sold: {top.quantity}
        </p>

        <p className="font-semibold text-xl text-green-600 dark:text-green-400">
          {currency?.symbol}{Number(top.revenue).toLocaleString()}
        </p>
      </>
    )}
  </motion.div>
);
