import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react"; // or your preferred icon library

const ExpandableSearch = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      // Focus the input when expanded
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClose = () => {
    setIsExpanded(false);
    setSearchValue("");
  };

  // Handle clicks outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      {!isExpanded ? (
        <div
          onClick={toggleExpand}
          className="w-8 h-8 rounded-md bg-primary flex items-center justify-center cursor-pointer"
        >
          <div className="text-white text-xl">
            <Search size={17} />
          </div>
        </div>
      ) : (
        <div className="w-48 h-8 rounded-md bg-primary flex items-center px-4  transition-all duration-300 ease-in-out">
          <Search size={17} className="text-white mr-2" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="bg-transparent border-none outline-none text-xs text-white flex-1 h-full w-20 focus:ring-0"
          />
          {searchValue && (
            <X
              size={17}
              className="text-gray-400 cursor-pointer hover:text-white"
              onClick={handleClose}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default ExpandableSearch;
