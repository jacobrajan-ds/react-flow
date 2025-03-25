import React, { FC } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { HttpResponseData } from "@/app/types/flow";

const HttpResponseNode: FC<NodeProps<HttpResponseData>> = ({ data }) => {
  return (
    <div className="bg-white border-1 border-gray-200 text-gray-800 p-2 rounded-md w-48">
      <div className="font-bold">{data.label || "HTTP Response"}</div>
      <div className="text-xs">Status: {data.statusCode || "200"}</div>
      <Handle type="target" position={Position.Left} id="input" />
    </div>
  );
};

export default HttpResponseNode;
