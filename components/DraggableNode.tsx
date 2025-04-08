import React from "react";

interface DraggableNodeProps {
  type: string;
  label: string;
  nodeInfo: any;
  onDragStart: (
    event: React.DragEvent,
    nodeType: string,
    nodeInfo: any
  ) => void;
}

const DraggableNode: React.FC<DraggableNodeProps> = ({
  type,
  label,
  nodeInfo,
  onDragStart,
}) => {
  const getBgColor = () => {
    switch (nodeInfo?.app_type) {
      case "START":
        return "bg-[#12362B] hover:bg-[#0D2B22]";
      case "PROCESS":
        return "bg-[#0A162E] hover:bg-[#071026]";
      case "END":
        return "bg-[#3A1A1A] hover:bg-[#2A1212]";
      default:
        return "bg-[#0A162E] hover:bg-[#071026]";
    }
  };

  const getNodeIcon = () => {
    const group = nodeInfo?.group?.toLowerCase() || "";

    if (group.includes("communication")) {
      return "📧";
    } else if (group.includes("input")) {
      return "📥";
    } else if (group.includes("output")) {
      return "📤";
    } else if (group.includes("process")) {
      return "⚙️";
    } else if (group.includes("data")) {
      return "💾";
    } else if (nodeInfo?.app_type === "START") {
      return "🚀";
    } else if (nodeInfo?.app_type === "END") {
      return "🏁";
    }

    return "📝";
  };

  return (
    <div
      className={`${getBgColor()} text-white px-3 py-1.5 rounded text-sm flex items-center gap-1.5 transition-colors cursor-grab active:cursor-grabbing`}
      draggable
      onDragStart={(event) => onDragStart(event, type, nodeInfo)}
    >
      <span className="text-lg">{getNodeIcon()}</span>
      <span>{label}</span>
    </div>
  );
};

export default DraggableNode;
