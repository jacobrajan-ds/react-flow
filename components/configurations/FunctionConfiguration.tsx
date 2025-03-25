import React, { FC, useState, useEffect } from "react";
import { CustomNode, FunctionData } from "@/app/types/flow";

interface FunctionConfigurationProps {
  node: CustomNode;
  onChange: (updatedData: Partial<FunctionData>) => void;
}

const FunctionConfiguration: FC<FunctionConfigurationProps> = ({
  node,
  onChange,
}) => {
  const data = node.data as FunctionData;

  const [label, setLabel] = useState(data.label || "");
  const [functionBody, setFunctionBody] = useState(
    data.functionBody ||
      `module.exports = function(msg) {
  // Your code here
  return msg;
}`
  );

  useEffect(() => {
    setLabel(data.label || "");
    setFunctionBody(
      data.functionBody ||
        `module.exports = function(msg) {
  // Your code here
  return msg;
}`
    );
  }, [data, node.id]);

  const updateParent = (updates: Partial<FunctionData>) => {
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
        <label className="block text-sm font-medium mb-1">Function</label>
        <textarea
          className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm h-64"
          value={functionBody}
          onChange={(e) => setFunctionBody(e.target.value)}
          onBlur={() => updateParent({ functionBody })}
        />
      </div>
    </div>
  );
};

export default FunctionConfiguration;
