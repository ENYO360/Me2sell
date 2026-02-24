// src/components/dashboard/Departments.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { auth, db } from "../../firebase/config";
import { useSearch } from "../../context/SearchContext";
import { useCart } from "../../context/CartContext";
import { useDirectSale } from "../../context/DirectSaleContext";
import { useNotification } from "../../context/NotificationContext";
import { useConfirmModal } from "../../context/ConfirmationContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useProducts } from "../../context/ProductContext";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";
import DashboardLayout from "./O_DashboardLayout";
import SaleModal from "./SaleModal";
import ProductImageCarousel from "./ProductImageCarousel";
import { FaPlus, FaTrash, FaEdit, FaArrowLeft, FaEllipsisV, FaShoppingCart, FaMoneyBill, FaMoneyBillWave } from "react-icons/fa";

export default function Departments() {
  const [departments, setDepartments] = useState([]); // list with productCount
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [selectedDept, setSelectedDept] = useState(null); // full-page detail view
  const [menuOpenFor, setMenuOpenFor] = useState(null); // three-dot menu per dept
  const [loading, setLoading] = useState(false);
  const [initialFormData, setInitialFormData] = useState(null);

  const { setScope, results } = useSearch();
  const { addToCart, checkoutCart } = useCart();
  const { startSale } = useDirectSale();
  const { notify } = useNotification();
  const { openConfirm } = useConfirmModal();
  const { currency } = useCurrency();
  const { products, getProductsByDepartment } = useProducts();

  const user = auth.currentUser;

  useEffect(() => {
    setScope("all-products");
  }, []);

  const fetchDepartments = async (uid) => {
    setFetching(true);

    const ref = collection(
      db,
      "departments",
      uid,
      "userDepartments"
    );

    const snap = await getDocs(ref);

    const list = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    setDepartments(list);
    setFetching(false);
  };

  // Fetch Departments and their products count
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        setDepartments([]);
        setFetching(false);
        return;
      }

      fetchDepartments(currentUser.uid);
    });

    return () => unsubAuth();
  }, []);

  const deptProducts = selectedDept
    ? getProductsByDepartment(selectedDept.id)
    : [];

  // Compute Product count per Department
  const departmentsWithCounts = departments.map((dept) => ({
    ...dept,
    productCount: products.filter(
      (p) => p.departmentId === dept.id
    ).length,
  }));

  const deptCounts = Object.fromEntries(
    departmentsWithCounts.map(d => [d.id, d.productCount])
  );

  // open detail view for a department (full page)
  const viewDepartmentDetails = (dept) => {
    setSelectedDept(dept);
  };

  // go back to list view (cleanup detail view)
  const backToList = () => {
    setSelectedDept(null);
  };

  // input change
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const isDeptFormUnchanged = () => {
    if (!editingDept || !initialFormData) return false;

    return (
      formData.name === initialFormData.name &&
      formData.description === initialFormData.description
    );
  };


  // create / update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const user = auth.currentUser;
    if (!user) return alert("Please sign in.");

    try {
      if (editingDept) {
        await updateDoc(
          doc(db, "departments", user.uid, "userDepartments", editingDept.id),
          {
            name: formData.name,
            description: formData.description,
            updatedAt: serverTimestamp(),
          }
        );

        await fetchDepartments(user.uid);

        localStorage.removeItem("departments");

        notify(`Department "${formData.name}" has been updated.`);
        openConfirm(`Department "${formData.name}" has been updated.`);
      } else {
        const deptRef = collection(
          db,
          "departments",
          user.uid,
          "userDepartments",
        );

        const newDocRef = await addDoc(deptRef, {
          uid: user.uid,
          name: formData.name,
          description: formData.description || "",
          createdAt: serverTimestamp(),
        });

        // Save generated ID inside the document
        await updateDoc(newDocRef, { departmentId: newDocRef.id });

        await fetchDepartments(user.uid);

        localStorage.removeItem("departments");

        notify(`Department "${formData.name}" has been created.`);
        openConfirm(`Department "${formData.name}" has been created.`);
      }

      setShowModal(false);
      setFormData({ name: "", description: "" });
      setEditingDept(null);
    } finally {
      setLoading(false);
    }
  };

  //Edit Department
  const handleEdit = (dept) => {
    const initialData = {
      name: dept.name || "",
      description: dept.description || "",
    };

    setEditingDept(dept);
    setFormData(initialData);
    setInitialFormData(initialData); // 🔥 store original
    setShowModal(true);
  };

  // Delete Department
  const handleDelete = async (dept) => {
    if (!window.confirm(`Delete department "${dept.name}"?`)) return;

    const uid = auth.currentUser.uid;

    await deleteDoc(
      doc(db, "departments", uid, "userDepartments", dept.id)
    );

    await fetchDepartments(user.uid);

    localStorage.removeItem("departments");

    notify(`Department "${dept.name}" has been deleted.`);
    openConfirm(`Department "${dept.name}" has been deleted.`);

    if (selectedDept?.id === dept.id) backToList();
  };

  // UI pieces
  const DeptCard = ({ dept }) => (
    <div
      className="bg-white dark:bg-[#0f1724] rounded-2xl p-4 shadow-md hover:shadow-lg transition transform hover:-translate-y-1 cursor-pointer h-full"
      onClick={(e) => { viewDepartmentDetails(dept); setMenuOpenFor(null) }}
      aria-hidden
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="md:text-lg text-sm font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">{dept.name}</h3>
          <p className="md:text-sm text-xs text-gray-500 dark:text-gray-300 mt-2 line-clamp-3">
            {dept.description || "No description"}
          </p>
        </div>
      </div>

      <div className="text-center mt-3">
        <div className="md:text-sm text-[8px] text-gray-900 dark:text-gray-400">Products</div>
        <div className="md:text-2xl text-xs font-bold mt-1 dark:text-gray-400 text-primary">{deptCounts[dept.id] ?? 0}</div>
      </div>

      <div className="flex items-center justify-between mt-4 w-full">
        <div className="text-xs text-gray-400">
          {dept.createdAt?.toDate ? dept.createdAt.toDate().toLocaleDateString() : ""}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpenFor(menuOpenFor === dept.id ? null : dept.id);
          }}
          className="p-2 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          title="More"
        >
          <FaEllipsisV />
        </button>
      </div>

      {/* three-dot dropdown */}
      {menuOpenFor === dept.id && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-6 mt-2 bg-white dark:bg-[#0b1220] border dark:border-gray-700 rounded-md shadow-lg p-2 z-40"
        >
          <button
            className="w-full text-left dark:text-gray-300 px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => {
              handleEdit(dept);
              setMenuOpenFor(null);
            }}
          >
            <FaEdit className="inline mr-2" /> Edit
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-red-500"
            onClick={() => {
              handleDelete(dept);
              setMenuOpenFor(null);
            }}
          >
            <FaTrash className="inline mr-2" /> Delete
          </button>
        </div>
      )}
    </div>
  );

  const searchActive = results.length > 0;
  const displayList = searchActive ? results : DeptCard;

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
      <div className="md:p-4 pt-8 mb-12" onClick={() => setMenuOpenFor(null)}>
        {/* Header */}
        {!selectedDept ? (
          <div className="flex items-center justify-between mb-6">
            <h2 className="md:text-2xl text-xl font-semibold dark:text-gray-300">Departments</h2>
            <button
              onClick={() => {
                setShowModal(true);
                setEditingDept(null);
                setInitialFormData(null);
                setFormData({ name: "", description: "" });
              }}
              className="flex md:text-lg text-xs items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-primary-dark"
            >
              <FaPlus /> Add Department
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={backToList}
                className="p-2 rounded-full dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <FaArrowLeft />
              </button>
              <h2 className="md:text-2xl text-xl dark:text-gray-300 font-semibold line-clamp-1">{selectedDept.name}</h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleEdit(selectedDept)}
                className="text-sm dark:text-gray-300 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(selectedDept)}
                className="text-sm px-3 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        {fetching ? (
          <div className="text-gray-500">Loading departments...</div>
        ) : !selectedDept ? (
          // grid of department cards
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 auto-rows-fr">
            {departments.map((dept) => (
              <div key={dept.id} className="relative">
                <DeptCard dept={dept} />
              </div>
            ))}
          </div>
        ) : (
          // full-page department details
          <div className="space-y-6" >
            <div className="bg-white dark:bg-[#0f1724] p-6 rounded-2xl shadow-md">
              <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedDept.description || "No description provided."}</p>
              <div className="flex gap-6 text-sm text-gray-700 dark:text-gray-200">
                <div><strong>Products:</strong> {deptCounts[selectedDept.id] ?? 0}</div>
                <div><strong>Created:</strong> {selectedDept.createdAt?.toDate ? selectedDept.createdAt.toDate().toLocaleString() : "—"}</div>
              </div>
            </div>

            <div className="bg-white dark:bg-[#0f1724] p-3 md:p-6 rounded-2xl shadow-md">
              <h4 className="text-lg font-semibold mb-4">Products in {selectedDept.name}</h4>
              {deptProducts.length === 0 ? (
                <p className="text-gray-500">No products in this department yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {(results.length > 0 ? results : deptProducts).map((p) => {
                    const isLowStock = p.quantity > 0 && p.quantity < 5;
                    const isOut = p.quantity === 0;
                    return (
                      <div key={p.id} className="relative p-1 border rounded-lg hover:shadow-md transition">
                        {/* 🔥 LOW STOCK WARNING */}
                        {isLowStock && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="absolute top-0 right-2 bg-yellow-400 text-black md:text-xs text-[10px] font-bold 
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
                            className="absolute top-0 right-2 bg-red-500 text-white md:text-xs text-[10px] font-bold 
                              px-3 py-1 rounded-full shadow"
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
                        <h5 className="font-bold md:text-lg text-xs line-clamp-1">{p.name}</h5>
                        <div className="md:text-sm text-xs text-gray-500">Price: {currency.symbol}{p.sellingPrice?.toLocaleString?.() ?? p.price}</div>
                        <div className="md:text-sm text-xs text-gray-400">Stock: {p.quantity ?? 0}</div>
                        <div className="md:text-sm text-xs text-gray-400 mt-1">Category: {p.category || "-"}</div>
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
                          <div className="flex flex-wrap gap-3 mt-1">
                            <button
                              onClick={() => addToCart(p)}
                              className="md:text-sm text-xs flex-1 bg-green-600 text-white p-2 rounded-lg flex items-center justify-center gap-2"
                            >
                              <FaShoppingCart /> Add
                            </button>

                            <button
                              onClick={() => startSale(p)}
                              className="md:text-sm text-xs flex-1 bg-blue-600 text-white p-2 rounded-lg flex items-center justify-center gap-2"
                            >
                              <FaMoneyBill /> Sell
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <SaleModal />
          </div>
        )}

        {/* Add / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
            <div className="bg-white dark:bg-[#0f1724] p-4 rounded-xl md:w-full w-3/4 max-w-md shadow-lg transform transition-all" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-semibold mb-4">{editingDept ? "Edit Department" : "Add Department"}</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Department name"
                  required
                  className="input w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Description (optional)"
                  rows={4}
                  className="input w-full p-2 border rounded-md dark:bg-gray-700 dark:text-white"
                />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => { setShowModal(false); setEditingDept(null); }} className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-600">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || isDeptFormUnchanged()}
                    className={`px-4 py-2 rounded-md text-white
                      ${loading || isDeptFormUnchanged()
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600"
                      }`}
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
