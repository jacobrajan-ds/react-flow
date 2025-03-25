import React, { FC, useState, useEffect } from "react";
import { CustomNode, HttpResponseData } from "@/app/types/flow";

interface HttpResponseConfigurationProps {
  node: CustomNode;
  onChange: (updatedData: Partial<HttpResponseData>) => void;
}

const HttpResponseConfiguration: FC<HttpResponseConfigurationProps> = ({
  node,
  onChange,
}) => {
  const data = node.data as HttpResponseData;

  // Local state for input values
  const [label, setLabel] = useState(data.label || "");
  const [statusCode, setStatusCode] = useState(data.statusCode || 200);
  const [contentType, setContentType] = useState(
    data.contentType || "application/json"
  );

  // Update local state when node changes
  useEffect(() => {
    setLabel(data.label || "");
    setStatusCode(data.statusCode || 200);
    setContentType(data.contentType || "application/json");
  }, [data, node.id]);

  // Update parent when local state changes
  const updateParent = (updates: Partial<HttpResponseData>) => {
    onChange(updates);
  };

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => updateParent({ label })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Status Code</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={statusCode}
          onChange={(e) => {
            const newStatusCode = parseInt(e.target.value);
            setStatusCode(newStatusCode);
            updateParent({ statusCode: newStatusCode });
          }}
        >
          <option value="200">200 - OK</option>
          <option value="201">201 - Created</option>
          <option value="400">400 - Bad Request</option>
          <option value="401">401 - Unauthorized</option>
          <option value="404">404 - Not Found</option>
          <option value="500">500 - Server Error</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Content Type</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={contentType}
          onChange={(e) => {
            setContentType(e.target.value);
            updateParent({ contentType: e.target.value });
          }}
        >
          <option value="application/json">application/json</option>
          <option value="text/plain">text/plain</option>
          <option value="text/html">text/html</option>
        </select>
      </div>
    </div>
  );
};

export default HttpResponseConfiguration;
