import React, { FC, DragEvent, useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface NodePanelProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
  nodeTypes: any[];
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

  // Extract unique categories from nodeTypes
  useEffect(() => {
    if (nodeTypes.length > 0) {
      const uniqueCategories = Array.from(
        new Set(nodeTypes.map((node) => node.category))
      );
      setCategories(uniqueCategories);
      setActiveCategory(uniqueCategories[0] || null);
    }
  }, [nodeTypes]);

  // Handle drag start to work with React Flow
  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: any) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({
        nodeType: nodeType.name,
        nodeInfo: nodeType,
      })
    );
    event.dataTransfer.effectAllowed = "move";
  };

  // Close panel when clicking outside
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

  // Filter nodes based on search term and active category
  const filteredNodes = nodeTypes.filter((node) => {
    const matchesSearch =
      !searchTerm ||
      node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (node.config_schema?.description || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesCategory = !activeCategory || node.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  console.log(filteredNodes);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 "
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="bg-[#071026] rounded-lg shadow-xl w-60 text-white max-h-[80vh] flex flex-col border border-[#00F6FF]/10"
        style={{
          position: "absolute",
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-[#00F6FF]/10">
          <h2 className="font-bold text-[#00F6FF]">Add Node</h2>
          <button
            className="text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search nodes..."
              className="w-full px-10 py-2 bg-[#0A162E] border border-[#00F6FF]/20 rounded-md focus:outline-none focus:border-[#00F6FF]/50 text-white"
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
          <div className="px-3">
            <div className="flex rounded-md gap-1 overflow-x-auto bg-[#0c3a4c] p-1">
              {categories.map((category) => (
                <button
                  key={category}
                  className={`p-2 rounded-md text-xs text-center whitespace-nowrap ${
                    activeCategory === category
                      ? "bg-[#0b253a] text-white"
                      : "text-white"
                  }`}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto p-4">
          {filteredNodes.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No nodes found matching your criteria
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredNodes.map((node, index) => (
                <div
                  key={node.id || index}
                  className="p-4 rounded border border-[#00F6FF]/20 flex flex-col items-center cursor-grab hover:border-[#00F6FF]/50 transition-colors bg-[#0A162E]"
                  onDragStart={(e) => onDragStart(e, node)}
                  draggable
                >
                  <div className="w-12 h-12 bg-[#0c3a4c] text-white rounded-full flex items-center justify-center mb-2">
                    {
                      // node.icon ? (
                      //   <span className="font-bold">{node.icon}</span>
                      // ) : (
                      <span className="text-[#00F6FF] font-bold">
                        {node.name.charAt(0).toUpperCase()}
                      </span>
                    }
                  </div>
                  <span className="text-center font-medium text-sm">
                    {node.name}
                  </span>
                  <span className="text-xs text-gray-400 text-center mt-1 line-clamp-1">
                    {node.group || node.app_type || ""}
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
