import React, { FC } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { HttpInData } from "@/app/types/flow";

const HttpInNode: FC<NodeProps<HttpInData>> = ({ data }) => {
  return (
    <div className="bg-white border-1 border-gray-200 text-gray-800 p-2 rounded-md w-48">
      <div className="font-bold">{data.label || "HTTP In"}</div>
      <div className="text-xs">
        {data.method || "GET"} {data.url || "/endpoint"}
      </div>
      <Handle type="source" position={Position.Right} id="output" />
    </div>
  );
};

export default HttpInNode;
