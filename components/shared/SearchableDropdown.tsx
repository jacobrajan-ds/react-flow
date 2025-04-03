import React, { useState, useEffect, useRef } from "react";
import { X, ChevronDown, Search } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  loading?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
}
const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
  loading = false,
  searchPlaceholder = "Search...",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter options based on search query
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get the selected option's label for display
  const selectedOption = options.find((option) => option.value === value);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative w-full`} ref={dropdownRef}>
      <div
        className={`flex items-center justify-between w-full px-4 py-3 bg-primary border border-darkborder text-white rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-base ${
          disabled ? "cursor-default" : "cursor-pointer"
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={`${selectedOption ? "text-white" : "text-gray-400"}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        {!disabled && (
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              isOpen ? "transform rotate-180" : ""
            }`}
          />
        )}
      </div>

      {!disabled && isOpen && (
        <div className="absolute w-full mt-1 bg-background-darkTertiary border border-bluegray rounded-md shadow-lg z-10">
          <div className="p-2 border-b border-bluegray">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-2 top-2.5 text-white"
              />
              <input
                type="text"
                className="w-full px-4 py-2 pl-8 bg-background-darkTertiary border border-bluegray rounded-md text-white"
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`px-4 py-3 cursor-pointer hover:bg-slate-700 text-white ${
                    option.value === value ? "bg-slate-700" : ""
                  }`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-white text-center">
                {loading ? "Loading..." : "No results found"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
