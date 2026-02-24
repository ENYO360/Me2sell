import React, { useState, useEffect, useRef } from "react";
import countries from "../../countries"; // we'll create this next

export default function CountrySelect({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef();

  const filtered = countries.filter((c) =>
    c.toLowerCase().includes(search.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      {/* INPUT FIELD */}
      <input
        disabled={disabled}
        value={value}
        onClick={() => !disabled && setOpen(!open)}
        onChange={() => {}}
        className="p-2 rounded bg-gray-200 dark:bg-gray-700 w-full cursor-pointer"
        placeholder="Select Country"
        readOnly
      />

      {/* DROPDOWN PANEL */}
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-700">

          {/* SEARCH BOX */}
          <div className="p-2 border-b border-gray-300 dark:border-gray-700">
            <input
              autoFocus
              placeholder="Search country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 rounded"
            />
          </div>

          {/* OPTIONS */}
          {filtered.length > 0 ? (
            filtered.map((country, i) => (
              <div
                key={i}
                onClick={() => {
                  onChange(country);
                  setOpen(false);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
              >
                {country}
              </div>
            ))
          ) : (
            <div className="p-3 text-gray-500 text-sm">No country found</div>
          )}
        </div>
      )}
    </div>
  );
}
