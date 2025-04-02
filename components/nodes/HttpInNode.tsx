import React, { FC } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { HttpInData } from "@/app/types/flow";

const HttpInNode: FC<NodeProps<HttpInData>> = ({ data }) => {
  return (
    <div className="bg-[#071026] border-1 border-gray-600 text-white p-2 rounded-md w-48">
      <div className="font-bold">{data.label || "HTTP In"}</div>
      <div className="text-xs">
        {data.method || "GET"} {data.url || "/endpoint"}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-2 !h-2 !bg-amber-500"
      />
    </div>
  );
};

export default HttpInNode;
