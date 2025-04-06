import React, { FC } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";

interface VariableNodeData {
  label: string;
  description: string;
}

const VariableNode: FC<NodeProps<VariableNodeData>> = ({ data }) => {
  return (
    <div className="bg-[#071026] border border-gray-600 text-white p-2 rounded-md w-48">
      <div className="font-bold">{data.label || "Variable Node"}</div>
      <div className="text-xs">
        {data.description || "Stores or retrieves variables"}
      </div>

      {/* Input Handle on the right side */}
      <Handle
        type="target"
        position={Position.Right}
        id="input"
        className="!w-2 !h-2 !bg-green-500"
      />

      {/* Output Handle on the left side */}
      <Handle
        type="source"
        position={Position.Left}
        id="output"
        className="!w-2 !h-2 !bg-green-500"
      />
    </div>
  );
};

export default VariableNode;
