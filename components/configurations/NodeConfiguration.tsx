import React from "react";

interface NodeConfigurationProps {
  node: any;
  onChange: (updatedData: any) => void;
}

const NodeConfiguration: React.FC<NodeConfigurationProps> = ({
  node,
  onChange,
}) => {
  // Handle input change
  const handleInputChange = (fieldName: string, value: any) => {
    onChange({
      values: {
        ...node.data.values,
        [fieldName]: value,
      },
    });
  };

  // If no config fields found
  if (!node.data.config || node.data.config.length === 0) {
    return (
      <div className="p-4 text-gray-400">
        No configuration options available for this node.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="text-xl">{getNodeIcon(node.data.nodeInfo)}</div>
        <div>
          <h4 className="text-md font-medium">
            {node.data.label} Configuration
          </h4>
          <p className="text-xs text-gray-400">
            {node.data.nodeInfo?.app_type || "PROCESS"}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-400">{node.data.description}</p>

      {node.data.config.map((field: any) => (
        <div key={field.name} className="space-y-1">
          <label className="text-sm font-medium">
            {field.name}
            {field.required !== false && (
              <span className="text-red-500">*</span>
            )}
          </label>

          {field.type === "string" && (
            <input
              type="text"
              value={node.data.values?.[field.name] || field.default || ""}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.description}
              className="w-full bg-[#071026] border border-gray-600 rounded p-2 text-sm"
            />
          )}

          {field.type === "boolean" && (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={
                  node.data.values?.[field.name] || field.default || false
                }
                onChange={(e) =>
                  handleInputChange(field.name, e.target.checked)
                }
                className="mr-2 bg-[#071026] border border-gray-600 rounded"
              />
              <span className="text-sm text-gray-400">{field.description}</span>
            </div>
          )}

          {field.type === "choice" && (
            <select
              value={node.data.values?.[field.name] || field.default || ""}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className="w-full bg-[#071026] border border-gray-600 rounded p-2 text-sm"
            >
              {field.options?.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}

          {field.description && field.type !== "boolean" && (
            <p className="text-xs text-gray-400">{field.description}</p>
          )}
        </div>
      ))}
    </div>
  );
};

// Helper function to get node icon
const getNodeIcon = (nodeInfo: any) => {
  const group = nodeInfo?.group?.toLowerCase() || "";

  if (group.includes("communication")) {
    return "📧"; // Email/Communication
  } else if (group.includes("input")) {
    return "📥"; // Input
  } else if (group.includes("output")) {
    return "📤"; // Output
  } else if (group.includes("process")) {
    return "⚙️"; // Process
  } else if (group.includes("data")) {
    return "💾"; // Data
  } else if (nodeInfo?.app_type === "START") {
    return "🚀"; // Start
  } else if (nodeInfo?.app_type === "END") {
    return "🏁"; // End
  }

  return "📝"; // Default
};

export default NodeConfiguration;
