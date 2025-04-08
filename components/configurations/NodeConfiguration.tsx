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
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    console.log("Node in configuration:", node);

    if (!node?.data) {
      console.warn("Node data is missing");
      setLoading(false);
      return;
    }

    const initialValues = { ...(node.data.values || {}) };

    // Handle schema structure with action and fields
    const schema = node.data.nodeTypeInfo?.config_schema || {};

    // Initialize action if it exists in schema
    if (
      schema.action &&
      Array.isArray(schema.action) &&
      schema.action.length > 0
    ) {
      const actionField = schema.action[0];
      const actionOptions = actionField.options || [];

      // Set default action value if not already set
      if (!initialValues[actionField.id]) {
        if (actionOptions.length > 0) {
          initialValues[actionField.id] =
            actionOptions[0].value || actionField.defaultValue;
        } else if (actionField.defaultValue) {
          initialValues[actionField.id] = actionField.defaultValue;
        }
      }

      // Set initial selected action
      setSelectedAction(initialValues[actionField.id] || "");
    }

    // Handle regular config fields
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

  const handleInputChange = (fieldName: string, value: any) => {
    const updatedValues = {
      ...localValues,
      [fieldName]: value,
    };
    console.log(`Setting ${fieldName} to:`, value);
    setLocalValues(updatedValues);
    onChange({ values: updatedValues });
  };

  const handleActionChange = (value: string) => {
    setSelectedAction(value);

    // Update the action field value
    const actionField = node.data.nodeTypeInfo?.config_schema?.action?.[0];
    if (actionField) {
      handleInputChange(actionField.id, value);
    }
  };

  // Get fields for selected action
  const getFieldsForAction = () => {
    const schema = node.data.nodeTypeInfo?.config_schema;
    if (!schema || !schema.fields) return [];

    // If fields is an object with keys for each action
    if (typeof schema.fields === "object" && !Array.isArray(schema.fields)) {
      return schema.fields[selectedAction] || [];
    }

    // If fields is a simple array
    return Array.isArray(schema.fields) ? schema.fields : [];
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

  const schema = node.data.nodeTypeInfo?.config_schema || {};
  const actionField = schema.action?.[0];
  const actionOptions = actionField?.options || [];
  const fieldsForAction = getFieldsForAction();

  console.log(actionField);

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

      {/* Action Field (if exists) */}
      {actionField && (
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">
            {actionField.label || actionField.id}
          </label>

          {actionOptions.length === 1 ? (
            // Single action - read-only field
            <input
              type="text"
              value={actionOptions[0].label || actionOptions[0].value}
              readOnly
              className="w-full bg-[#071026] border border-gray-700 rounded p-2 text-sm cursor-not-allowed"
            />
          ) : (
            // Multiple actions - dropdown
            <select
              value={selectedAction}
              onChange={(e) => handleActionChange(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
            >
              {actionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Dynamic fields based on selected action */}
      {fieldsForAction.length > 0 && (
        <div className="border-t border-gray-700 pt-4 mt-4">
          <h4 className="text-sm text-gray-400 mb-4">Configuration</h4>

          {fieldsForAction.map((field: any) => (
            <div key={field.id || field.name} className="mb-4">
              <label className="block text-sm font-medium mb-1">
                {field.label || field.name}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {(field.type === "text" || field.type === "string") && (
                <input
                  type="text"
                  value={localValues[field.name] || localValues[field.id] || ""}
                  onChange={(e) =>
                    handleInputChange(field.name || field.id, e.target.value)
                  }
                  placeholder={field.description}
                  className="w-full bg-[#071026] border border-gray-700 rounded p-2 text-sm"
                />
              )}

              {field.type === "password" && (
                <input
                  type="password"
                  value={localValues[field.name] || localValues[field.id] || ""}
                  onChange={(e) =>
                    handleInputChange(field.name || field.id, e.target.value)
                  }
                  placeholder="••••••••"
                  className="w-full bg-[#071026] border border-gray-700 rounded p-2 text-sm"
                />
              )}

              {field.type === "boolean" && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={Boolean(
                      localValues[field.name] || localValues[field.id]
                    )}
                    onChange={(e) =>
                      handleInputChange(
                        field.name || field.id,
                        e.target.checked
                      )
                    }
                    className="mr-2 bg-[#071026] border border-gray-700 rounded"
                  />
                  <span className="text-sm text-gray-400">
                    {field.description}
                  </span>
                </div>
              )}

              {(field.type === "choice" || field.type === "select") && (
                <select
                  value={localValues[field.name] || localValues[field.id] || ""}
                  onChange={(e) =>
                    handleInputChange(field.name || field.id, e.target.value)
                  }
                  className="w-full bg-[#071026] border border-gray-700 rounded p-2 text-sm"
                >
                  {(field.options || []).map((option: any) => (
                    <option
                      key={option.value || option}
                      value={option.value || option}
                    >
                      {option.label || option.value || option}
                    </option>
                  ))}
                </select>
              )}

              {field.description && field.type !== "boolean" && (
                <p className="text-xs text-gray-400 mt-1">
                  {field.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Configuration Fields for simple config */}
      {(!actionField || actionOptions.length === 0) &&
        Array.isArray(node.data.config) &&
        node.data.config.length > 0 && (
          <div className="space-y-4">
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
                    onChange={(e) =>
                      handleInputChange(field.name, e.target.value)
                    }
                    placeholder={field.description}
                    className="w-full bg-[#071026] border border-gray-700 rounded p-2 text-sm"
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
                      className="mr-2 bg-[#071026] border border-gray-700 rounded"
                    />
                    <span className="text-sm text-gray-400">
                      {field.description}
                    </span>
                  </div>
                )}

                {field.type === "choice" && (
                  <select
                    value={localValues[field.name] || ""}
                    onChange={(e) =>
                      handleInputChange(field.name, e.target.value)
                    }
                    className="w-full bg-[#071026] border border-gray-700 rounded p-2 text-sm"
                  >
                    {(field.options || []).map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                )}

                {field.description && field.type !== "boolean" && (
                  <p className="text-xs text-gray-400 mt-1">
                    {field.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

      {/* No configuration message */}
      {(!actionField || actionOptions.length === 0) &&
        (!Array.isArray(node.data.config) || node.data.config.length === 0) && (
          <div className="p-4 text-gray-400">
            <p className="mb-2">
              No configuration options available for this node.
            </p>
            <p className="text-sm">
              Node type: {node?.data?.label || node?.type}
            </p>
          </div>
        )}

      {/* Debug Info */}
      <div className="mt-8 pt-4 border-t border-gray-700">
        <details className="text-xs text-gray-500">
          <summary>Debug Node Info</summary>
          <pre className="mt-2 p-2 bg-gray-900 rounded overflow-auto max-h-40">
            {JSON.stringify(
              {
                id: node.id,
                type: node.data.label,
                action: selectedAction,
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
