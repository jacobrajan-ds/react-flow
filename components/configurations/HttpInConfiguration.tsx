import React, { FC, useState, useEffect } from "react";
import { CustomNode, HttpInData } from "@/app/types/flow";

interface HttpInConfigurationProps {
  node: CustomNode;
  onChange: (updatedData: Partial<HttpInData>) => void;
}

const HttpInConfiguration: FC<HttpInConfigurationProps> = ({
  node,
  onChange,
}) => {
  const data = node.data as HttpInData;

  // Local state for input values
  const [label, setLabel] = useState(data.label || "");
  const [method, setMethod] = useState(data.method || "GET");
  const [url, setUrl] = useState(data.url || "/");

  // Update local state when node changes
  useEffect(() => {
    setLabel(data.label || "");
    setMethod(data.method || "GET");
    setUrl(data.url || "/");
  }, [data, node.id]);

  // Update parent when local state changes
  const updateParent = (updates: Partial<HttpInData>) => {
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
        <label className="block text-sm font-medium mb-1">Method</label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={method}
          onChange={(e) => {
            const newMethod = e.target.value as
              | "GET"
              | "POST"
              | "PUT"
              | "DELETE";
            setMethod(newMethod);
            updateParent({ method: newMethod });
          }}
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">URL</label>
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={() => updateParent({ url })}
        />
      </div>
    </div>
  );
};

export default HttpInConfiguration;
