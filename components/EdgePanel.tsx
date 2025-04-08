import React, { FC, useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface EdgePanelProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
  edgeData: any;
  onEdgeDataChange: (updatedData: any) => void;
}

const EdgePanel: FC<EdgePanelProps> = ({
  isOpen,
  onClose,
  position = { x: 100, y: 100 },
  edgeData,
  onEdgeDataChange,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onEdgeDataChange({ ...edgeData, [name]: value });
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onEdgeDataChange({ ...edgeData, [name]: checked });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/20"
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
          <h2 className="font-bold text-[#00F6FF]">Customize Edge</h2>
          <button
            className="text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <label className="block mb-2">Label</label>
            <input
              type="text"
              name="label"
              value={edgeData.label || ""}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#0A162E] border border-[#00F6FF]/20 rounded-md focus:outline-none focus:border-[#00F6FF]/50 text-white"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">Animation</label>
            <input
              type="checkbox"
              name="animated"
              checked={edgeData.animated || false}
              onChange={handleToggleChange}
              className="toggle-checkbox"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">Stroke width</label>
            <input
              type="range"
              name="strokeWidth"
              min="1"
              max="10"
              value={edgeData.strokeWidth || 1}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">Color</label>
            <input
              type="color"
              name="color"
              value={edgeData.color || "#000000"}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EdgePanel;
