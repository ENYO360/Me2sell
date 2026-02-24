import React, { useState } from "react";
import currencies from "../../currencies";

export default function CurrencySelect({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = currencies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <input
        disabled={disabled}
        value={value?.name || ""}
        onClick={() => (disabled ? null : setOpen(!open))}
        className="p-2 w-full rounded bg-gray-200 dark:bg-gray-700 cursor-pointer"
        placeholder="Select currency"
        readOnly
      />

      {open && !disabled && (
        <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 shadow-lg rounded max-h-56 overflow-auto">

          <input
            autoFocus
            className="p-2 w-full border-b dark:bg-gray-700"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {filtered.map((currency) => (
            <div
              key={currency.name}
              onClick={() => {
                onChange(currency);      // <— returns { name, symbol }
                setOpen(false);
                setSearch("");
              }}
              className="p-2 hover:bg-blue-100 dark:hover:bg-gray-700 cursor-pointer"
            >
              {currency.name} ({currency.symbol})
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="p-2 text-gray-400 text-sm">No matches</p>
          )}
        </div>
      )}
    </div>
  );
}
