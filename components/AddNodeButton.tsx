// app/components/AddNodeButton.tsx
import React, { FC, useState } from "react";
import { FiPlus } from "react-icons/fi";
import NodePanel from "./NodePanel";

const AddNodeButton: FC = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });

  const handleOpenPanel = (e: React.MouseEvent) => {
    // Position the panel near the button
    const buttonRect = e.currentTarget.getBoundingClientRect();
    setPanelPosition({
      x: buttonRect.left,
      y: buttonRect.bottom + 10,
    });
    setIsPanelOpen(true);
  };

  return (
    <>
      <button
        className="bg-white text-gray-700 rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-gray-200 transition-colors"
        onClick={handleOpenPanel}
      >
        <FiPlus size={24} />
      </button>

      <NodePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        position={panelPosition}
      />
    </>
  );
};

export default AddNodeButton;
