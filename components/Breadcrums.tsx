import React from "react";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  onNavigate: (id: string) => void;
}

export default function Breadcrumb({ items, onNavigate }: BreadcrumbProps) {
  return (
    <div className="flex items-center text-sm text-gray-400 mb-4 overflow-x-auto">
      <button
        onClick={() => onNavigate("")}
        className="flex items-center hover:text-white"
      >
        <Home size={16} className="mr-1" />
        <span>Home</span>
      </button>

      {items.map((item, index) => (
        <React.Fragment key={item.id}>
          <ChevronRight size={16} className="mx-2" />
          <button
            onClick={() => onNavigate(item.id)}
            className={`${
              index === items.length - 1
                ? "text-white font-medium"
                : "hover:text-white"
            }`}
          >
            {item.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
