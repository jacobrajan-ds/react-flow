// app/components/NodePanel.tsx
import React, { FC, DragEvent, useState, useRef, useEffect } from "react";
import { FiPlus, FiType, FiX } from "react-icons/fi";

interface NodePanelProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
}

const NodePanel: FC<NodePanelProps> = ({
  isOpen,
  onClose,
  position = { x: 100, y: 100 },
}) => {
  const [activeTab, setActiveTab] = useState("Wireframe");
  const [searchTerm, setSearchTerm] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);

  const onDragStart = (event: DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
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

  // Filter nodes based on search term
  const filterNodes = (nodes: { type: string; label: string }[]) => {
    if (!searchTerm) return nodes;
    return nodes.filter((node) =>
      node.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Node definitions by category
  const nodeCategories = {
    Wireframe: [
      { type: "httpIn", label: "HTTP In" },
      { type: "httpResponse", label: "HTTP Response" },
      { type: "function", label: "Function" },
    ],
    // Shape: [
    //   { type: "debug", label: "Debug" },
    //   { type: "switch", label: "Switch" },
    //   { type: "delay", label: "Delay" },
    // ],
    // Social: [
    //   { type: "twitter", label: "Twitter" },
    //   { type: "slack", label: "Slack" },
    //   { type: "email", label: "Email" },
    // ],
  };

  // Get nodes for the active tab
  const activeNodes = filterNodes(
    nodeCategories[activeTab as keyof typeof nodeCategories] || []
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0  flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="bg-white rounded-lg shadow-xl w-3xs max-h-[80vh] flex flex-col"
        style={{
          position: "absolute",
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with close button */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="font-bold text-lg">Add Node</h2>
          <button
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Search bar */}
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
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

        {/* Tabs */}
        {/* <div className="flex border-b border-gray-200">
          {Object.keys(nodeCategories).map((category) => (
            <button
              key={category}
              className={`flex-1 py-2 text-center ${
                activeTab === category
                  ? "bg-gray-100 text-black font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
              onClick={() => setActiveTab(category)}
            >
              {category}
            </button>
          ))}
        </div> */}
        {/* 
        <div className="px-4 py-3 text-gray-500 text-sm">
          Tap on a node or drag and drop it to add to the flow
        </div> */}

        <div className="flex-1 overflow-auto p-4">
          <h3 className="font-bold text-lg mb-4">Content</h3>

          <div className="grid grid-cols-2 gap-4">
            {activeNodes.map((node, index) => (
              <div
                key={index}
                className="bg-gray-50 p-4 rounded border border-gray-200 flex flex-col items-center cursor-grab hover:border-gray-300 transition-colors"
                onDragStart={(e) => onDragStart(e, node.type)}
                draggable
              >
                <div className="w-full h-10 flex items-center justify-center mb-2 rounded">
                  {getNodeIcon(node.type)}
                </div>
                <span className="text-center !text-[14px]">{node.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function to get node icons
function getNodeIcon(type: string) {
  switch (type) {
    case "httpIn":
      return (
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-blue-600 font-bold">IN</span>
        </div>
      );
    case "httpResponse":
      return (
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-green-600 font-bold">OUT</span>
        </div>
      );
    case "function":
      return (
        <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
          <span className="text-yellow-600 font-bold">FN</span>
        </div>
      );
    default:
      return (
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-600 font-bold">?</span>
        </div>
      );
  }
}

export default NodePanel;
