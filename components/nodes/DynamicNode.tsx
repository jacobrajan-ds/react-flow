import React, { FC } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

interface DynamicNodeData {
  label: string;
  description: string;
  nodeInfo: {
    app_type: string;
    name: string;
    group: string;
    category: string;
    [key: string]: any;
  };
  [key: string]: any;
}

const DynamicNode: FC<NodeProps<DynamicNodeData>> = ({ data, selected }) => {
  // Determine node styling based on app_type
  const getNodeStyle = () => {
    const baseStyle = "border p-2 rounded-md w-48 shadow-lg";

    switch (data.nodeInfo?.app_type) {
      case "START":
        return `${baseStyle} bg-[#12362B] border-green-500`;
      case "PROCESS":
        return `${baseStyle} bg-[#071026] border-[#00F6FF]/60`;
      case "END":
        return `${baseStyle} bg-[#3A1A1A] border-red-500`;
      default:
        return `${baseStyle} bg-[#071026] border-gray-600`;
    }
  };

  // Determine handle colors based on app_type
  const getHandleColor = () => {
    switch (data.nodeInfo?.app_type) {
      case "START":
        return "#4ade80"; // green
      case "PROCESS":
        return "#00F6FF"; // cyan
      case "END":
        return "#ef4444"; // red
      default:
        return "#93c5fd"; // blue
    }
  };

  // Get an icon based on the node type or group
  const getNodeIcon = () => {
    const group = data.nodeInfo?.group?.toLowerCase() || "";

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
    } else if (data.nodeInfo?.app_type === "START") {
      return "🚀"; // Start
    } else if (data.nodeInfo?.app_type === "END") {
      return "🏁"; // End
    }

    return "📝"; // Default
  };

  // Determine if this node should have input handles
  const hasInputHandle = data.nodeInfo?.app_type !== "START";

  // Determine if this node should have output handles
  const hasOutputHandle = data.nodeInfo?.app_type !== "END";

  return (
    <div className={`${getNodeStyle()} ${selected ? "ring-2 ring-white" : ""}`}>
      <div className="flex items-center gap-2 mb-1">
        <div className="text-xl">{getNodeIcon()}</div>
        <div className="font-bold text-white overflow-hidden text-ellipsis">
          {data.label || "Node"}
        </div>
      </div>
      <div className="text-xs text-gray-300 overflow-hidden">
        {data.description || data.nodeInfo?.config_schema?.description || ""}
      </div>

      {/* Input Handle */}
      {hasInputHandle && (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          className="!w-2 !h-2"
          style={{ background: getHandleColor() }}
        />
      )}

      {/* Output Handle */}
      {hasOutputHandle && (
        <Handle
          type="source"
          position={Position.Right}
          id="output"
          className="!w-2 !h-2"
          style={{ background: getHandleColor() }}
        />
      )}
    </div>
  );
};

export default DynamicNode;
