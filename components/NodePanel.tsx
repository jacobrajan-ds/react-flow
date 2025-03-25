import React, { FC, DragEvent, useState, useRef, useEffect } from "react";
import { FiX } from "react-icons/fi";
import { NodeTypeDefinition } from "@/app/types/flow";

interface NodePanelProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
  nodeTypes: NodeTypeDefinition[];
}

const NodePanel: FC<NodePanelProps> = ({
  isOpen,
  onClose,
  position = { x: 100, y: 100 },
  nodeTypes,
}) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (nodeTypes.length > 0) {
      const uniqueCategories = Array.from(
        new Set(nodeTypes.map((node) => node.category))
      );
      setCategories(uniqueCategories);
      setActiveCategory(uniqueCategories[0] || null);
    }
  }, [nodeTypes]);

  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const filteredNodes = nodeTypes.filter((node) => {
    const matchesSearch =
      !searchTerm ||
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !activeCategory || node.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="bg-white rounded-lg shadow-xl w-96 max-h-[80vh] flex flex-col"
        style={{
          position: "absolute",
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="font-bold text-lg">Add Node</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search nodes..."
              className="w-full px-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 text-center whitespace-nowrap ${
                  activeCategory === category
                    ? "bg-gray-100 text-black font-medium border-b-2 border-blue-500"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          {filteredNodes.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No nodes found matching your criteria
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredNodes.map((node, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-4 rounded border border-gray-200 flex flex-col items-center cursor-grab hover:border-gray-300 transition-colors"
                  onDragStart={(e) => onDragStart(e, node.id)}
                  draggable
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                    {node.icon ? (
                      <span className="text-gray-600 font-bold">
                        {node.icon}
                      </span>
                    ) : (
                      <span className="text-gray-600 font-bold">
                        {node.label.charAt(0)}
                      </span>
                    )}
                  </div>
                  <span className="text-center font-medium">{node.label}</span>
                  <span className="text-xs text-gray-500 text-center mt-1">
                    {node.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodePanel;
