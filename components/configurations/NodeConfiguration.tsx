import React, { useEffect, useState } from "react";

interface NodeConfigurationProps {
  node: any;
  onChange: (updatedData: any) => void;
}

const NodeConfiguration: React.FC<NodeConfigurationProps> = ({
  node,
  onChange,
}) => {
  const [localValues, setLocalValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset state when node changes
    setLoading(true);

    // Log the node for debugging
    console.log("Node in configuration:", node);

    if (!node?.data) {
      console.warn("Node data is missing");
      setLoading(false);
      return;
    }

    // Initialize with existing values
    const initialValues = { ...(node.data.values || {}) };

    // If config fields exist, make sure all fields have a value (use defaults if needed)
    if (Array.isArray(node.data.config)) {
      node.data.config.forEach((field: any) => {
        if (initialValues[field.name] === undefined) {
          if (
            field.type === "choice" &&
            Array.isArray(field.options) &&
            field.options.length > 0
          ) {
            initialValues[field.name] = field.options[0];
          } else if (field.default !== undefined) {
            initialValues[field.name] = field.default;
          } else {
            // Set appropriate default based on type
            if (field.type === "boolean") {
              initialValues[field.name] = false;
            } else if (field.type === "string") {
              initialValues[field.name] = "";
            } else {
              initialValues[field.name] = null;
            }
          }
        }
      });
    }

    console.log("Initial field values:", initialValues);
    setLocalValues(initialValues);
    setLoading(false);
  }, [node]);

  // Handle input change
  const handleInputChange = (fieldName: string, value: any) => {
    const updatedValues = {
      ...localValues,
      [fieldName]: value,
    };
    console.log(`Setting ${fieldName} to:`, value);
    setLocalValues(updatedValues);
    onChange({ values: updatedValues });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-pulse text-[#00F6FF]">
          Loading configuration...
        </div>
      </div>
    );
  }

  // Check if there are config fields
  if (!node?.data?.config || node.data.config.length === 0) {
    return (
      <div className="p-4 text-gray-400">
        <p className="mb-2">
          No configuration options available for this node.
        </p>
        <p className="text-sm">Node type: {node?.data?.label || node?.type}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Node Type Info */}
      <div className="mb-6">
        <h3 className="text-md font-semibold text-[#00F6FF]">
          {node.data.label}
        </h3>
        {node.data.description && (
          <p className="text-sm text-gray-400 mt-1">{node.data.description}</p>
        )}
      </div>

      {/* Configuration Fields */}
      {node.data.config.map((field: any) => (
        <div key={field.name} className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {field.name}
            {field.required !== false && (
              <span className="text-red-500 ml-1">*</span>
            )}
          </label>

          {field.type === "string" && (
            <input
              type="text"
              value={localValues[field.name] || ""}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.description}
              className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
            />
          )}

          {field.type === "boolean" && (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={Boolean(localValues[field.name])}
                onChange={(e) =>
                  handleInputChange(field.name, e.target.checked)
                }
                className="mr-2 bg-gray-800 border border-gray-600 rounded"
              />
              <span className="text-sm text-gray-400">{field.description}</span>
            </div>
          )}

          {field.type === "choice" && (
            <select
              value={localValues[field.name] || ""}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
            >
              {(field.options || []).map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}

          {field.description && field.type !== "boolean" && (
            <p className="text-xs text-gray-400 mt-1">{field.description}</p>
          )}
        </div>
      ))}

      {/* Debug Info */}
      <div className="mt-8 pt-4 border-t border-gray-700">
        <details className="text-xs text-gray-500">
          <summary>Debug Node Info</summary>
          <pre className="mt-2 p-2 bg-gray-900 rounded overflow-auto max-h-40">
            {JSON.stringify(
              {
                id: node.id,
                type: node.data.label,
                configFields: node.data.config.map((f: any) => f.name),
                values: localValues,
              },
              null,
              2
            )}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default NodeConfiguration;
