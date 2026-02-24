import React, { useEffect, useState } from "react";
import DashboardLayout from "./O_DashboardLayout";
import { useSearch } from "../../context/SearchContext";
import { useNotification } from "../../context/NotificationContext";
import { useConfirmModal } from "../../context/ConfirmationContext";
import { useCurrency } from "../../context/CurrencyContext";
import { useProducts } from "../../context/ProductContext";
import { db, auth } from "../../firebase/config";
import { getStorage, ref, deleteObject, getDownloadURL, uploadBytesResumable } from "firebase/storage";
import { compressTo50KB } from "../../utils/compressImage";
import { app } from "../../firebase/config";
import { useMeta } from "../../context/MetaContext";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { BiDotsVerticalRounded } from "react-icons/bi";

export default function Products() {
  const { categories, departments, loading } = useMeta();

  const [modalOpen, setModalOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [errors, setErrors] = useState({});

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [stockFilter, setStockFilter] = useState("all"); // all | low | out

  const [form, setForm] = useState({
    name: "",
    costPrice: "",
    sellingPrice: "",
    quantity: "",
    category: "",
    department: "",
    description: "",
    image: null,
    image2: null,
  });

  const [initialForm, setInitialForm] = useState(form);

  const [user, setUser] = useState(null);
  const { setScope, results } = useSearch();
  const { notify } = useNotification();
  const { openConfirm } = useConfirmModal();
  const { currency } = useCurrency();
  const { products } = useProducts();

  const storage = getStorage(app);

  useEffect(() => {
    setScope("all-products");
  }, []);


  // ================
  // AUTH WATCHER
  // ================
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      if (!u) return;

      setUser(u);
    });

    return () => unsub();
  }, []);

  // Modal scroll lock
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [modalOpen]);

  // ================
  // OPEN ADD PRODUCT MODAL
  // ================
  const openAddModal = () => {
    setEditingProduct(null);
    setInitialForm(null);
    setForm({
      name: "",
      costPrice: "",
      sellingPrice: "",
      quantity: "",
      category: "",
      department: "",
      description: "",
      image: null,
      image2: null,
    });
    setModalOpen(true);
  };

  // ================
  // OPEN EDIT MODAL
  // ================
  const openEditModal = (product) => {
    const initialData = {
      name: product.name,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      category: product.categoryId || "",
      department: product.departmentId || "",
      description: product.description || "",
      image: product.image || null,
      image2: product.image2 || null,
    };

    setEditingProduct(product);
    setForm(initialData);
    setInitialForm(initialData);
    setModalOpen(true);
  };

  // Product Image Upload
  const uploadImage = async (file, uid, productId, index, setProgress) => {
    if (!file) return null;
    if (!auth.currentUser) throw new Error("Auth not ready");

    const compressedFile = await compressTo50KB(file);

    const imageRef = ref(
      storage,
      `products/${uid}/${productId}/image_${index}`
    );

    const uploadTask = uploadBytesResumable(imageRef, compressedFile);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const percent =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(Math.round(percent));
        },
        reject,
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(url);
        }
      );
    });
  };

  const isFormUnchanged = () => {
    if (!editingProduct || !initialForm) return false;

    return (
      form.name === initialForm.name &&
      String(form.costPrice) === String(initialForm.costPrice) &&
      String(form.sellingPrice) === String(initialForm.sellingPrice) &&
      String(form.quantity) === String(initialForm.quantity) &&
      form.category === initialForm.category &&
      form.department === initialForm.department &&
      form.description === initialForm.description &&
      !(form.image instanceof File) &&
      !(form.image2 instanceof File)
    );
  };

  // ================
  // HANDLE FORM SUBMIT
  // ================
  const saveProduct = async () => {
    if (!user || uploading) return;
    if (!validateForm()) return;

    const selectedDept = departments.find(d => d.id === form.department);
    const selectedCategory = categories.find(c => c.id === form.category);

    setUploading(true);

    let productId;

    if (editingProduct) {
      productId = editingProduct.id;
    } else {
      const ref = await addDoc(
        collection(db, "products", user.uid, "productList"),
        { createdAt: serverTimestamp() }
      );
      productId = ref.id;
    }

    const imageUrl =
      form.image instanceof File
        ? await uploadImage(form.image, user.uid, productId, "1", setUploadProgress)
        : editingProduct?.image || "";

    const imageUrl2 =
      form.image2 instanceof File
        ? await uploadImage(form.image2, user.uid, productId, "2", setUploadProgress)
        : editingProduct?.image2 || "";

    await setDoc(
      doc(db, "products", user.uid, "productList", productId),
      {
        name: form.name,
        costPrice: Number(form.costPrice),
        sellingPrice: Number(form.sellingPrice),
        quantity: Number(form.quantity),
        category: selectedCategory?.name || "",
        categoryId: selectedCategory?.id || "",
        department: selectedDept?.name || "",
        departmentId: selectedDept?.id || "",
        description: form.description,
        image: imageUrl,
        image2: imageUrl2,
        uid: user.uid,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setUploading(false);
    setUploadProgress(0);

    notify(`Product "${form.name}" ${editingProduct ? "updated" : "added"}`, "product");
    openConfirm(`Product "${form.name}" ${editingProduct ? "updated" : "added"}.`);
    setModalOpen(false);
  };


  // ================
  // DELETE PRODUCT
  // ================
  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product permanently?")) return;

    try {
      const productRef = doc(db, "products", user.uid, "productList", id);
      const productSnap = await getDoc(productRef);

      if (!productSnap.exists()) {
        alert("Product not found");
        return;
      }

      const productData = productSnap.data();

      const storage = getStorage(app);

      // 🔥 Delete image 1 if exists
      if (productData.image) {
        const imageRef = ref(storage, productData.image);
        await deleteObject(imageRef).catch(() => { });
      }

      // 🔥 Delete image 2 if exists
      if (productData.image2) {
        const imageRef2 = ref(storage, productData.image2);
        await deleteObject(imageRef2).catch(() => { });
      }

      // 🔥 Finally delete Firestore document
      await deleteDoc(productRef);

      openConfirm(`Product "${productData.name}" has been deleted.`);
      notify(`Product "${productData.name}" has been deleted.`, "product");

    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete product");
    }
  };

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".menu-area")) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (form.costPrice === "" || isNaN(form.costPrice) || Number(form.costPrice) <= 0) {
      newErrors.costPrice = "Cost price is required";
    }

    if (form.sellingPrice === "" || isNaN(form.sellingPrice) || Number(form.sellingPrice) <= 0) {
      newErrors.sellingPrice = "Selling price is required";
    }

    setErrors(newErrors);

    // valid only if no errors
    return Object.keys(newErrors).length === 0;
  };

  const lowCount = products.filter(p => p.quantity > 0 && p.quantity <= 5).length;
  const outCount = products.filter(p => p.quantity === 0).length;
  const allCount = products.length;

  return (
    <DashboardLayout>
      <div className="space-y-6 mb-12">
        {/* STOCK FILTER */}
        <div className="flex gap-3 mt-28 md:mt-0 flex-wrap justify-center">

          <button
            onClick={() => setStockFilter("all")}
            className={`px-4 py-2 rounded-lg text-sm font-medium
                ${stockFilter === "all"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 dark:bg-gray-700"
              }`}
          >
            All ({allCount})
          </button>

          <button
            onClick={() => setStockFilter("low")}
            className={`px-4 py-2 rounded-lg text-sm font-medium
                ${stockFilter === "low"
                ? "bg-yellow-500 text-white"
                : "bg-gray-200 dark:bg-gray-700"
              }`}
          >
            Low Stock ({lowCount})
          </button>

          <button
            onClick={() => setStockFilter("out")}
            className={`px-4 py-2 rounded-lg text-sm font-medium
                ${stockFilter === "out"
                ? "bg-red-500 text-white"
                : "bg-gray-200 dark:bg-gray-700"
              }`}
          >
            Out of Stock ({outCount})
          </button>
        </div>

        {/* HEADER */}
        <div className="flex justify-between items-center mt-32 md:mt-5">
          <h1 className="md:text-3xl text-2xl font-semibold text-gray-800 dark:text-white">
            Products
          </h1>

          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
          >
            <FaPlus /> Add Product
          </button>
        </div>

        {/* PRODUCT GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
          {(() => {

            const baseList = results.length > 0 ? results : products;

            const filteredList = baseList.filter(p => {
              const qty = Number(p.quantity);

              if (stockFilter === "low") {
                return qty > 0 && qty <= 5;
              }

              if (stockFilter === "out") {
                return qty === 0;
              }

              return true; // all
            });

            return filteredList.map((p) => {


              const isLowStock = p.quantity > 0 && p.quantity <= 5;
              const isOut = p.quantity === 0;

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`relative p-5 bg-white dark:bg-gray-800 rounded-xl shadow 
                  ${isOut ? "opacity-80" : "hover:shadow-lg"} transition`}
                >

                  {/* 🔥 LOW STOCK WARNING */}
                  {isLowStock && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="absolute top-1 left-2 bg-yellow-400 text-black 
              md:text-xs text-[10px] font-bold px-3 py-1 rounded-full shadow animate-pulse"
                    >
                      Low Stock ({p.quantity})
                    </motion.div>
                  )}

                  {/* ❌ OUT OF STOCK BADGE */}
                  {isOut && (
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.25 }}
                      className="absolute top-1 left-2 bg-red-500 text-white 
              md:text-xs text-[10px] font-bold px-3 py-1 rounded-full shadow"
                    >
                      Out of Stock
                    </motion.div>
                  )}

                  <h3 className="md:text-xl text-sm font-bold text-gray-800 dark:text-white mb-1 line-clamp-2">
                    {p.name}
                  </h3>

                  <div className="my-3">
                    <p className="text-blue-700 dark:text-gray-200 font-semibold md:text-lg text-[12px]">
                      Cost Price: {currency.symbol}{Number(p.costPrice).toLocaleString()}
                    </p>

                    <p className="text-gray-700 dark:text-gray-200 font-semibold md:text-lg text-[12px]">
                      Selling Price: {currency.symbol}{Number(p.sellingPrice).toLocaleString()}
                    </p>

                    <p className="text-green-700 font-semibold md:text-lg text-[12px]">
                      Profit: {currency.symbol}{(Number(p.sellingPrice) - Number(p.costPrice)).toLocaleString()}
                    </p>

                  </div>

                  <p className="text-gray-500 dark:text-gray-400 md:text-lg text-[12px]">
                    Quantity: {p.quantity}
                  </p>

                  <p className="text-gray-600 dark:text-gray-300 md:text-lg text-[10px]">
                    Category: {p.category || "—"}
                  </p>

                  <p className="text-gray-600 dark:text-gray-300 md:text-lg text-[10px]">
                    Department: {p.department || "—"}
                  </p>

                  {/* ACTION MENU (Three Dots) */}
                  <div className="absolute top-3 right-3 menu-area">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === p.id ? null : p.id);
                      }}
                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <BiDotsVerticalRounded size={22} className="text-gray-600 dark:text-gray-300" />
                    </button>

                    {/* DROPDOWN MENU */}
                    {openMenuId === p.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-900 shadow-lg rounded-lg border 
                 border-gray-200 dark:border-gray-700 overflow-hidden"
                      >
                        {/* EDIT */}
                        <button
                          onClick={() => {
                            openEditModal(p);
                            setOpenMenuId(null);
                          }}
                          className="w-full mb-3 flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-left"
                        >
                          <FaEdit size={16} className="text-blue-600" /> Edit
                        </button>

                        {/* DELETE */}
                        <button
                          onClick={() => {
                            deleteProduct(p.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 
                     dark:hover:bg-red-900/30 text-left"
                        >
                          <FaTrash size={16} /> Delete
                        </button>
                      </motion.div>
                    )}
                  </div>

                </motion.div>
              );
            });
          })()}
        </div>


        {/* ===================== */}
        {/* ADD/EDIT MODAL */}
        {/* ===================== */}
        <AnimatePresence>
          {modalOpen && (
            /* 🔲 OVERLAY */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}   // 👈 close on outside click
              className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center md:p-6 p-12 z-50"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                onClick={(e) => e.stopPropagation()} // 👈 prevent closing when clicking inside
                className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto"
              >
                <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-white">
                  {editingProduct ? "Edit Product" : "Add Product"}
                </h2>

                {/* FORM INPUTS */}
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={form.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      setForm({ ...form, name: value })

                      if (value && Number(value) > 0) {
                        setErrors({ ...errors, name: null });
                      }
                    }}
                    className={`w-full p-2 text-sm border rounded dark:bg-gray-800 dark:text-white ${errors.name ? "border-red-500" : ""}`}
                  />
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

                  {/* COST PRICE */}
                  <input
                    type="number"
                    placeholder="Cost Price"
                    value={form.costPrice}
                    onChange={(e) => {
                      setForm({ ...form, costPrice: e.target.value })
                      setErrors({ ...errors, costPrice: null });
                    }}
                    className={`w-full p-2 text-sm border rounded dark:bg-gray-800 dark:text-white ${errors.costPrice ? "border-red-500" : ""}`}
                  />
                  {errors.costPrice && <p className="text-red-500 text-sm">{errors.costPrice}</p>}

                  {/* SELLING PRICE */}
                  <input
                    type="number"
                    placeholder="Selling Price"
                    value={form.sellingPrice}
                    onChange={(e) => {
                      setForm({ ...form, sellingPrice: e.target.value })
                      setErrors({ ...errors, sellingPrice: null });
                    }}
                    className={`w-full p-2 text-sm border rounded dark:bg-gray-800 dark:text-white ${errors.sellingPrice ? "border-red-500" : ""}`}
                  />
                  {errors.sellingPrice && <p className="text-red-500 text-sm">{errors.sellingPrice}</p>}

                  {/* QUANTITY */}
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:text-white"
                  />

                  {/* CATEGORY DROPDOWN */}
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* DEPARTMENT DROPDOWN */}
                  <select
                    value={form.department}
                    onChange={(e) =>
                      setForm({ ...form, department: e.target.value })
                    }
                    className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {/* DESCRIPTION */}
                  <textarea
                    placeholder="Product Description"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    rows={3}
                    className="w-full p-2 text-sm border rounded dark:bg-gray-800 dark:text-white"
                  />

                  <div>
                    <label className="text-sm font-medium">Product Image 1</label>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setForm({ ...form, image: e.target.files[0] })
                      }
                      className="w-full mt-1"
                    />

                    {form.image && typeof form.image === "string" && (
                      <img
                        src={form.image}
                        alt="preview"
                        className="mt-2 h-12 rounded object-cover"
                      />
                    )}
                  </div>


                  <div>
                    <label className="text-sm font-medium">Product Image 2</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setForm({ ...form, image2: e.target.files[0] })
                      }
                      className="w-full mt-1"
                    />

                    {form.image2 && typeof form.image2 === "string" && (
                      <img src={form.image2} alt="preview" className="mt-2 h-12 rounded object-cover" />
                    )}
                  </div>

                  {uploading && (
                    <div className="w-full mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Uploading image...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                </div>

                {/* BUTTONS */}
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded bg-gray-300 dark:bg-gray-700"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={saveProduct}
                    disabled={isFormUnchanged()}
                    className={`px-4 py-2 rounded text-white
                        ${isFormUnchanged()
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                      }`}
                  >
                    Save
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

