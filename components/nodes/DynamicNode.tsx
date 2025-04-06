import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

const DynamicNode = memo(({ data, isConnectable, selected }: NodeProps) => {
  // Check if node has values configured
  const hasValues = data.values && Object.keys(data.values).length > 0;

  // Filter out internal properties for display
  const displayValues = hasValues
    ? Object.entries(data.values)
        .filter(([key]) => key !== "label" && key !== "description")
        .map(([key, value]) => ({ key, value }))
    : [];

  // Count configured values
  const configuredCount = displayValues.length;

  return (
    <div
      className={`rounded-md bg-[#0a253f] border ${
        selected ? "border-[#00F6FF]" : "border-[#00F6FF]/30"
      } 
                 text-white p-2 min-w-[150px] ${
                   selected ? "shadow-lg shadow-[#00F6FF]/20" : ""
                 }`}
    >
      {/* Node header */}
      <div className="font-medium text-[#00F6FF] mb-1">{data.label}</div>

      {/* Description - only show 2 lines max */}
      {data.description && (
        <div className="text-xs text-gray-300 mb-2 line-clamp-2">
          {data.description}
        </div>
      )}

      {/* Configuration summary */}
      {configuredCount > 0 ? (
        <div className="text-xs bg-[#071026] p-1 rounded mt-1 text-gray-400 max-h-16 overflow-auto">
          {displayValues.slice(0, 2).map(({ key, value }) => (
            <div key={key} className="truncate">
              <span className="text-[#00F6FF]/70">{key}:</span> {String(value)}
            </div>
          ))}
          {configuredCount > 2 && (
            <div className="text-gray-500 italic text-xs mt-1">
              +{configuredCount - 2} more...
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs bg-[#071026] p-1 rounded mt-1 text-gray-500 italic">
          Click to configure
        </div>
      )}

      {/* Handles for connections */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: "#00F6FF" }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: "#00F6FF" }}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default DynamicNode;
