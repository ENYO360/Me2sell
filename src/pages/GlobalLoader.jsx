import { motion, AnimatePresence } from "framer-motion";

export default function GlobalLoader({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-white dark:bg-gray-900 
                     flex items-center justify-center"
        >
          {/* Spinner */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            className="w-12 h-12 border-4 border-blue-600 
                       border-t-transparent rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
