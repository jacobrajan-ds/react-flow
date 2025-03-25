import React, { FC } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { FunctionData } from "@/app/types/flow";

const FunctionNode: FC<NodeProps<FunctionData>> = ({ data }) => {
  return (
    <div className="bg-white border-1 border-gray-200 text-gray-800 p-2 rounded-md w-48">
      <div className="font-bold">{data.label || "Function"}</div>
      <div className="text-xs">JavaScript function</div>
      <Handle type="target" position={Position.Left} id="input" />
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
};

export default FunctionNode;
