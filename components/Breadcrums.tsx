import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { useRouter } from "next/navigation";

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (item: BreadcrumbItem | null, index: number) => void;
}

export default function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-400 mb-4">
      <button
        onClick={() => onNavigate(null, -1)}
        className="flex items-center hover:text-white transition-colors"
      >
        <Home size={16} />
        <span className="ml-1">Home</span>
      </button>

      {items.length > 0 && <ChevronRight size={14} className="text-gray-600" />}

      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <button
            onClick={() => onNavigate(item, index)}
            className={`hover:text-white transition-colors ${
              index === items.length - 1 ? "text-white font-medium" : ""
            }`}
          >
            {item.name}
          </button>
          {index < items.length - 1 && (
            <ChevronRight size={14} className="text-gray-600" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
