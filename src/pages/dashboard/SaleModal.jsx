import { useState, useEffect, useRef } from "react";
import { useDirectSale } from "../../context/DirectSaleContext";
import { useCurrency } from "../../context/CurrencyContext";

export default function SaleModal() {
  const { selectedProduct, isSaleModalOpen, cancelSale, confirmSale } =
    useDirectSale();

  const [price, setPrice] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const priceInputRef = useRef(null);

  const { currency } = useCurrency();

  // Load product price into state when modal opens
  useEffect(() => {
    if (selectedProduct) {
      setPrice(selectedProduct.sellingPrice);
    }
  }, [selectedProduct]);

  // Auto-focus when switching to edit mode
  useEffect(() => {
    if (isEditing && priceInputRef.current) {
      priceInputRef.current.focus();
    }
  }, [isEditing]);

  if (!isSaleModalOpen || !selectedProduct) return null;

  return (
    /* 🔲 OVERLAY (clicking here closes modal) */
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={cancelSale}
    >
      {/* ⬜ MODAL CONTENT (clicks here do NOT close modal) */}
      <div
        className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6 animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-3 text-gray-800">
          Sell Product
        </h2>

        <p className="text-gray-600 mb-4 text-lg font-medium">
          {selectedProduct.name}
        </p>

        <label className="text-gray-700 block mb-1 font-medium">
          Selling Price
        </label>

        {/* PRICE DISPLAY MODE */}
        {!isEditing && (
          <>
          <div
            onClick={() => setIsEditing(true)}
            className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-900 font-semibold cursor-pointer hover:bg-gray-200 transition"
          >
            {currency.symbol} {price}
          </div>
          <p className="text-gray-500 text-sm ">click on Price to edit</p>
          </>
        )}

        {/* PRICE EDIT MODE */}
        {isEditing && (
          <input
            type="number"
            ref={priceInputRef}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={() => {
              if (price === "") setPrice("0");
              setIsEditing(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (price === "") setPrice("0");
                setIsEditing(false);
              }
            }}
            className="w-full px-3 py-2 border rounded-lg mb-4 bg-white text-gray-800 font-semibold shadow-sm"
          />
        )}

        <div className="flex justify-between mt-4">
          <button
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            onClick={cancelSale}
          >
            Cancel
          </button>

          <button
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            onClick={() => confirmSale(Number(price))}
          >
            Confirm Sale
          </button>
        </div>
      </div>
    </div>
  );
}
