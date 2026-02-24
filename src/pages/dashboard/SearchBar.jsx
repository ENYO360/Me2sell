import { useSearch } from "../../context/SearchContext";
import { useProducts } from "../../context/ProductContext";
import { useEffect } from "react";

export default function SearchBar() {
  const { query, setQuery, setResults } = useSearch();
  const { products } = useProducts();

  useEffect(() => {
    if (!query || !query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();

    const filtered = products.filter(product =>
      Object.values(product).some(value =>
        String(value).toLowerCase().includes(q)
      )
    );

    setResults(filtered);
  }, [query, products]);

  return (
    <input
      type="text"
      placeholder="Search products..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="md:mr-4 w-full px-4 py-2 rounded-full border border-gray-300 focus:ring"
    />
  );
}
