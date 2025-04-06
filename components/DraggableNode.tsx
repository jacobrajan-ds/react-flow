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
  // Determine background color based on app_type
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

  // Get an icon based on the node type or group
  const getNodeIcon = () => {
    const group = nodeInfo?.group?.toLowerCase() || "";

    if (group.includes("communication")) {
      return "📧"; // Email/Communication
    } else if (group.includes("input")) {
      return "📥"; // Input
    } else if (group.includes("output")) {
      return "📤"; // Output
    } else if (group.includes("process")) {
      return "⚙️"; // Process
    } else if (group.includes("data")) {
      return "💾"; // Data
    } else if (nodeInfo?.app_type === "START") {
      return "🚀"; // Start
    } else if (nodeInfo?.app_type === "END") {
      return "🏁"; // End
    }

    return "📝"; // Default
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
