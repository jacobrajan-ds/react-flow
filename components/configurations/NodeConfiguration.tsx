import React, { useEffect, useState } from "react";

interface NodeConfigurationProps {
  node: any;
  onChange: (updatedData: any) => void;
}

const NodeConfiguration: React.FC<NodeConfigurationProps> = ({
  node,
  onChange,
}) => {
  const [localValues, setLocalValues] = useState(node?.data?.values || {});

  useEffect(() => {
    console.log("Node structure:", node);

    // Find configuration schema wherever it might be
    const configFields =
      node?.data?.config || node?.data?.nodeInfo?.config_schema?.fields || [];

    if (!configFields || configFields.length === 0) {
      console.warn("Node configuration schema is missing or invalid:", node);
      setLocalValues({});
      return;
    }

    let initialValues: any = {};

    // Handle array format (fields)
    if (Array.isArray(configFields)) {
      initialValues = configFields.reduce((acc: any, field: any) => {
        acc[field.name] = node.data.values?.[field.name] ?? field.default ?? "";
        return acc;
      }, {});
    }
    // Handle properties format
    else if (configFields.properties) {
      initialValues = Object.entries(configFields.properties).reduce(
        (acc: any, [key, value]: [string, any]) => {
          acc[key] = node.data.values?.[key] ?? value.default ?? "";
          return acc;
        },
        {}
      );
    }

    setLocalValues(initialValues);
  }, [node]);

  // Handle input change
  const handleInputChange = (fieldName: string, value: any) => {
    const updatedValues = {
      ...localValues,
      [fieldName]: value,
    };
    setLocalValues(updatedValues);
    onChange({ values: updatedValues });
  };

  // Render configuration fields
  const renderFields = () => {
    // Try to find config fields in various possible locations
    const configFields =
      node?.data?.config || node?.data?.nodeInfo?.config_schema?.fields || [];

    // If config is in array format (fields)
    if (Array.isArray(configFields) && configFields.length > 0) {
      return configFields.map((field: any) => (
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
              value={localValues?.[field.name] || ""}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              placeholder={field.description}
              className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
            />
          )}

          {field.type === "boolean" && (
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={localValues?.[field.name] || false}
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
              value={localValues?.[field.name] || field.options?.[0] || ""}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
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
      ));
    }

    // If config is in properties format
    const propertiesConfig =
      node?.data?.config?.properties ||
      node?.data?.nodeInfo?.config_schema?.properties;

    if (propertiesConfig) {
      return Object.entries(propertiesConfig).map(
        ([key, value]: [string, any]) => {
          const required =
            node?.data?.config?.required?.includes(key) ||
            node?.data?.nodeInfo?.config_schema?.required?.includes(key);

          return (
            <div key={key} className="space-y-1">
              <label className="text-sm font-medium">
                {key}
                {required && <span className="text-red-500">*</span>}
              </label>

              {value.type === "string" && (
                <input
                  type="text"
                  value={localValues?.[key] || ""}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  placeholder={value.description || ""}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
                />
              )}

              {value.type === "boolean" && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localValues?.[key] || false}
                    onChange={(e) => handleInputChange(key, e.target.checked)}
                    className="mr-2 bg-gray-800 border border-gray-600 rounded"
                  />
                  <span className="text-sm text-gray-400">
                    {value.description || ""}
                  </span>
                </div>
              )}

              {value.enum && (
                <select
                  value={localValues?.[key] || value.enum[0] || ""}
                  onChange={(e) => handleInputChange(key, e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
                >
                  {value.enum.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              )}

              {value.description && value.type !== "boolean" && (
                <p className="text-xs text-gray-400">{value.description}</p>
              )}
            </div>
          );
        }
      );
    }

    return (
      <div className="p-4 text-gray-400">
        <p>No configuration options available for this node.</p>
        <p className="text-xs mt-2">
          Node type: {node?.data?.label || node?.type}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderFields()}

      {/* Debug info - can be removed in production */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <details className="text-xs text-gray-500">
          <summary>Debug Node Info</summary>
          <pre className="mt-2 p-2 bg-gray-900 rounded overflow-auto max-h-40">
            {JSON.stringify(
              {
                id: node?.id,
                type: node?.type,
                label: node?.data?.label,
                hasConfig: Boolean(
                  node?.data?.config?.length ||
                    node?.data?.nodeInfo?.config_schema
                ),
                valuesCount: Object.keys(localValues || {}).length,
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
