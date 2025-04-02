import React, { FC } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { FunctionData } from "@/app/types/flow";

const FunctionNode: FC<NodeProps<FunctionData>> = ({ data }) => {
  return (
    <div className="bg-[#071026] border-1 border-gray-600 text-white p-2 rounded-md w-48">
      <div className="font-bold">{data.label || "Function"}</div>
      <div className="text-xs">JavaScript function</div>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-2 !h-2 !bg-amber-500"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-2 !h-2 !bg-amber-500"
      />
    </div>
  );
};

export default FunctionNode;
