import { useState } from "react";
import { motion } from "framer-motion";
import { AnimatePresence } from "framer-motion";

const swipeConfidenceThreshold = 80; // Adjust as needed

export default function ProductImageCarousel({ images = [], imgHeight }) {
  const [index, setIndex] = useState(0);
  const [zoomedImage, setZoomedImage] = useState(null);


  if (!images.length) {
    return (
      <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-xs">
        <img src="my" alt="Product Image" />
      </div>
    );
  }

  const next = () =>
    setIndex((prev) => (prev + 1) % images.length);

  const prev = () =>
    setIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className={`relative w-full h-${imgHeight || "32"} overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700`}>
      <motion.img
        src={images[index]}
        onClick={() => setZoomedImage(images[index])}
        alt="product"
        className="absolute inset-0 w-full h-full object-cover"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragEnd={(e, info) => {
          if (info.offset.x < -swipeConfidenceThreshold) next();
          if (info.offset.x > swipeConfidenceThreshold) prev();
        }}
        initial={false}
        animate={{ opacity: 1, }}
        transition={{ duration: 0.2 }}
      />

      {/* 🔵 DOT INDICATORS */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
        {images.map((_, i) => (
          <span
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full cursor-pointer transition
              ${i === index ? "bg-white" : "bg-white/50"}`}
          />
        ))}
      </div>

       {/* ZOOM MODAL */}
            <AnimatePresence>
                {zoomedImage && (
                    <motion.div
                        layout={false}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                        onClick={() => setZoomedImage(null)}
                    >
                        <motion.img
                            src={zoomedImage}
                            alt="Zoomed product"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            transition={{ duration: 0.25 }}
                            onClick={(e) => e.stopPropagation()}
                            className="md:max-w-full max-w-[95%] max-h-full rounded-lg shadow-xl cursor-zoom-out"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
    </div>
  );
}