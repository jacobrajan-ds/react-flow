import React, { FC } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { HttpResponseData } from "@/app/types/flow";

const HttpResponseNode: FC<NodeProps<HttpResponseData>> = ({ data }) => {
  return (
    <div className="bg-[#071026] border-2 border-gray-700 text-white p-2 rounded-md w-48">
      <div className="font-bold">{data.label || "HTTP Response"}</div>
      <div className="text-xs">Status: {data.statusCode || "200"}</div>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-2 !h-2 !bg-amber-500"
      />
    </div>
  );
};

export default HttpResponseNode;
