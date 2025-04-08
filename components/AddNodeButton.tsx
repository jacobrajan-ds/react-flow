import React, { FC, useState } from "react";
import { Plus } from "lucide-react";
import NodePanel from "./NodePanel";

interface AddNodeButtonProps {
  nodeTypes: any[];
}

const AddNodeButton: FC<AddNodeButtonProps> = ({ nodeTypes }) => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });

  const handleOpenPanel = (e: React.MouseEvent) => {
    const buttonRect = e.currentTarget.getBoundingClientRect();
    setPanelPosition({
      x: buttonRect.right + 10,
      y: buttonRect.bottom - 45,
    });
    setIsPanelOpen(true);
  };

  return (
    <>
      <button
        className="bg-[#071026] text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg hover:bg-[#0A162E] transition-colors border border-[#00F6FF]/30"
        onClick={handleOpenPanel}
      >
        <Plus size={24} />
      </button>

      <NodePanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        position={panelPosition}
        nodeTypes={nodeTypes}
      />
    </>
  );
};

export default AddNodeButton;
