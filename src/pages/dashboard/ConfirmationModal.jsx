import React from "react";
import { useConfirmModal } from "../../context/ConfirmationContext";
import { motion, AnimatePresence } from "framer-motion";

export default function ConfirmationModal() {
  const { modal, closeConfirm, confirm } = useConfirmModal();

  return (
    <AnimatePresence>
      {modal.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeConfirm}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]"
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-[90%] max-w-md"
          >
            <h3 className="text-lg font-semibold dark:text-white text-gray-800 mb-2">
              Message!
            </h3>

            <p className="text-gray-600 dark:text-gray-300 mb-5">
              {modal.message}
            </p>

            <div className="flex justify-end gap-3">


              <button
                onClick={confirm}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white"
              >
                {modal.buttonText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
