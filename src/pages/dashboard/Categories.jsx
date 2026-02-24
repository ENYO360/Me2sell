import React, { useEffect, useState, useMemo } from "react";
import { db, auth } from "../../firebase/config";
import DashboardLayout from "./O_DashboardLayout.jsx";
import ProductImageCarousel from "./ProductImageCarousel.jsx";
import SaleModal from "./SaleModal.jsx";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { MARKETPLACE_CATEGORIES } from "../../marketplaceCategories";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext";
import { useSearch } from "../../context/SearchContext.jsx";
import { useDirectSale } from "../../context/DirectSaleContext.jsx";
import { useNotification } from "../../context/NotificationContext.jsx";
import { useConfirmModal } from "../../context/ConfirmationContext.jsx"
import { useCurrency } from "../../context/CurrencyContext.jsx";
import { useProducts } from "../../context/ProductContext.jsx";
import { motion } from "framer-motion";

import {
  FaPlus,
  FaFolder,
  FaArrowLeft,
  FaTrash,
  FaEdit,
  FaShoppingCart,
  FaMoneyBill,
  FaMoneyBillWave
} from "react-icons/fa";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [initialEditData, setInitialEditData] = useState(null);


  const [newCategory, setNewCategory] = useState({
    name: "",
    description: ""
  });

  const [editData, setEditData] = useState({ categoryId: "", description: "" });

  const { addToCart, checkoutCart } = useCart();
  const { setScope, results } = useSearch();
  const { startSale } = useDirectSale();
  const { notify } = useNotification();
  const { openConfirm } = useConfirmModal();
  const { currency } = useCurrency();
  const { products, getProductsByCategory } = useProducts();
  const { user } = useAuth();

  useEffect(() => {
    setScope("all-products");
  }, []);

  // Fetch Categories
  const fetchCategories = async (uid) => {
    const ref = collection(db, "categories", uid, "userCategories");
    const snap = await getDocs(ref);

    setCategories(
      snap.docs.map(d => ({ id: d.id, ...d.data() }))
    );
  };

  useEffect(() => {
    if (!user) {
      setCategories([]);
      return;
    }

    fetchCategories(user.uid);
  }, [user]);

  //  🔍 PRODUCTS BY CATEGORY (IN-MEMORY)
  const categoryProducts = useMemo(() => {
    if (!activeCategory) return [];
    return products.filter(p => p.categoryId === activeCategory.id);
  }, [activeCategory, products]);

  //  📊 CATEGORY PRODUCT COUNT
  const categoryCounts = useMemo(() => {
    const counts = {};

    for (const p of products) {
      counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
    }

    return counts;
  }, [products]);

  // Select Category
  const openCategory = (cat) => {
    setActiveCategory(cat);
  };

  // Create Category
  const handleCreate = async () => {
    if (!newCategory.name) return alert("Category name required.");

    const uid = auth.currentUser.uid;

    const categoryId = newCategory.name;

    // Find full category info
    const categoryMeta = MARKETPLACE_CATEGORIES.find(
      (c) => c.id === categoryId
    );

    if (!categoryMeta) {
      return alert("Invalid category selected.");
    }

    // Path: categories > uid > categoryId
    const categoryRef = doc(
      db,
      "categories",
      uid,
      "userCategories",
      categoryId // 👈 THIS is the ID
    );

    // Prevent duplicates
    const existing = await getDocs(
      query(
        collection(db, "categories", uid, "userCategories"),
        where("categoryId", "==", categoryId)
      )
    );

    if (!existing.empty) {
      return alert("This category already exists.");
    }

    await setDoc(categoryRef, {
      categoryId,               // electronics
      name: categoryMeta.name,  // Electronics
      description: newCategory.description || "",
      createdAt: serverTimestamp(),
    });

    await fetchCategories(uid);

    localStorage.removeItem("categories");

    notify(`Category "${newCategory.name}" created.`, "category");
    openConfirm(`Category, "${newCategory.name}" has been created.`, "category")
    setShowCreateModal(false);
  };

  // Check if Edit Form is unchanged
  const isCategoryUnchanged = () => {
    if (!initialEditData) return false;

    return (
      editData.name === initialEditData.name &&
      editData.description === initialEditData.description
    );
  };

  // Edit Category
  const handleEdit = async () => {
    const uid = auth.currentUser.uid;

    const ref = doc(
      db,
      "categories",
      uid,
      "userCategories",
      activeCategory.id
    );

    await updateDoc(ref, {
      name: editData.name,
      description: editData.description,
    });

    await fetchCategories(uid);

    localStorage.removeItem("categories");

    notify(`Category "${editData.name}" updated.`, "category");
    openConfirm(`Category "${editData.name}" has been updated.`);
    setShowEditModal(false);
  };

  // Delete Category
  const handleDelete = async () => {
    const confirmDelete = window.confirm("Delete this category?");
    if (!confirmDelete) return;

    const uid = auth.currentUser.uid;

    await deleteDoc(
      doc(db, "categories", uid, "userCategories", activeCategory.id)
    );

    await fetchCategories(uid);

    localStorage.removeItem("categories");

    notify(`You deleted category: ${activeCategory.name}`);
    openConfirm(`You deleted category: ${activeCategory.name}`);
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
      <div className="md:px-6 mb-12">

        {/* LIST VIEW */}
        {!activeCategory && (
          <div className="md:mt-1 mt-28">
            <div className="flex justify-between items-center mb-6">
              <h1 className="md:text-2xl text-xl dark:text-gray-300 font-bold">Categories</h1>

              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white md:text-lg text-sm md:px-4 px-2 py-2 rounded-lg flex items-center gap-2"
              >
                <FaPlus /> Add Category
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.03 }}
                  onClick={() => openCategory(cat)}
                  className="p-4 rounded-xl bg-white dark:bg-gray-800 shadow cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FaFolder className="text-blue-600 md:text-xl text-sm" />
                    <h2 className="font-semibold md:text-lg text-sm dark:text-gray-300 line-clamp-1">{cat.name}</h2>
                  </div>

                  <p className="text-gray-500 md:text-sm text-xs dark:text-gray-300 mt-2 line-clamp-2">
                    {cat.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORY DETAILS VIEW */}
        {activeCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="md:mt-1 mt-28"
          >
            {/* Back Button */}
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-2 mb-4 text-blue-500"
            >
              <FaArrowLeft /> Back to Categories
            </button>

            {/* HEADER */}
            <div className="flex justify-between gap-3 items-center">
              <div className="mr-1">
                <h1 className="md:text-3xl dark:text-gray-300 text-xl font-bold line-clamp-1">{activeCategory.name}</h1>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    const initial = {
                      name: activeCategory.name || "",
                      description: activeCategory.description || "",
                    };

                    setEditData(initial);
                    setInitialEditData(initial); // 🔥 store original
                    setShowEditModal(true);
                  }}
                  className="bg-blue-600 text-white md:text-lg text-[10px] px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <FaEdit /> Edit
                </button>

                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white md:text-lg text-[10px] px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>

            <div className="bg-slate-200 dark:bg-gray-700 p-4 rounded-lg mt-4">
              <p className="text-gray-600 dark:text-gray-300 mt-1">{activeCategory.description}</p>
              <p className="text-gray-600 dark:text-gray-300 mt-1">Products: {categoryCounts[activeCategory.id] ?? 0}</p>
              <p className="dark:text-gray-400">Created at: {activeCategory.createdAt?.toDate().toLocaleString()}</p>
            </div>

            {/* PRODUCTS LIST */}
            <h2 className="text-xl dark:text-gray-300 font-bold mt-8 mb-4">Products in this Category</h2>

            {categoryProducts.length === 0 ? (
              <p className="text-gray-500">No products in this category yet.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {categoryProducts.map((p) => {
                  const isLowStock = p.quantity > 0 && p.quantity <= 5;
                  const isOut = p.quantity === 0;

                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative p-1 bg-white dark:bg-gray-800 shadow rounded-xl"
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
                          Low Stock ({p.quantity})
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
                      <ProductImageCarousel
                        images={[
                          p.image,
                          p.image2
                        ].filter(Boolean)}
                      />
                      <h3 className="font-semibold md:text-lg text-sm dark:text-gray-300 line-clamp-1">{p.name}</h3>
                      <p className="text-gray-500 md:text-lg text-sm">{currency.symbol}{p.sellingPrice.toLocaleString()}</p>
                      <p className="text-gray-500 md:text-sm text-xs">Stock: {p.quantity}</p>
                      <p className="text-gray-500 md:text-sm text-xs">Department: {p.department}</p>

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

                        <div className="flex flex-wrap justify-between gap-3 mt-1">
                          <button
                            onClick={() => addToCart(p)}
                            className=" bg-green-600 text-white md:text-sm text-xs p-2 rounded-lg flex items-center justify-center gap-2"
                          >
                            <FaShoppingCart /> Add
                          </button>

                          <button
                            onClick={() => startSale(p)}
                            className=" bg-blue-600 text-white md:text-sm text-xs p-2 rounded-lg flex items-center justify-center gap-2"
                          >
                            <FaMoneyBill /> Sell
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            )}

            <SaleModal />
          </motion.div>
        )}

        {/* CREATE MODAL */}
        {showCreateModal && (
          <ModalWrapper onClose={() => setShowCreateModal(false)}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Create Category</h2>

              <select
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200 mb-3"
                value={newCategory.name}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, name: e.target.value })
                }
              >
                <option value="" disabled>
                  Select Category
                </option>
                {MARKETPLACE_CATEGORIES.filter(cat => cat.id !== "all").map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <textarea
                placeholder="Description"
                className="w-full p-2 border rounded dark:bg-gray-700"
                value={newCategory.description}
                onChange={(e) =>
                  setNewCategory({ ...newCategory, description: e.target.value })
                }
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 rounded bg-blue-600 text-white"
                >
                  Create
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}

        {/* EDIT MODAL */}
        {showEditModal && (
          <ModalWrapper onClose={() => setShowEditModal(false)}>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Edit Category</h2>

              <select
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-gray-200 mb-3"
                value={editData.categoryId}
                onChange={(e) =>
                  setEditData({ ...editData, name: e.target.value })
                }
              >
                <option value="" disabled>
                  Select Category
                </option>
                {MARKETPLACE_CATEGORIES.filter(cat => cat.id !== "all").map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <textarea
                className="w-full p-2 border rounded dark:bg-gray-700"
                value={editData.description}
                onChange={(e) =>
                  setEditData({ ...editData, description: e.target.value })
                }
              />

              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  disabled={isCategoryUnchanged()}
                  className={`px-4 py-2 rounded text-white
                    ${isCategoryUnchanged()
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                  Save
                </button>
              </div>
            </div>
          </ModalWrapper>
        )}
      </div>
    </DashboardLayout>
  );
}

function ModalWrapper({ children, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose} // 👈 outside click closes modal
      className="fixed inset-0 bg-black/40 backdrop-blur-sm 
                 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()} // 👈 prevent close
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
