import React, { FC, useState, useEffect } from "react";
import { CustomNode } from "@/app/types/flow";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(
  () => import("@monaco-editor/react").then((mod) => mod.default),
  { ssr: false }
);
interface NodeConfigurationProps {
  node: CustomNode;
  onChange: (updatedData: any) => void;
}

const NodeConfiguration: FC<NodeConfigurationProps> = ({ node, onChange }) => {
  const [configSchema, setConfigSchema] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localData, setLocalData] = useState<any>({});

  useEffect(() => {
    setLocalData(node.data || {});
  }, [node.id, node.data]);

  useEffect(() => {
    async function fetchNodeConfig() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/node-config/${node.type}`);
        if (!response.ok) {
          throw new Error(`Failed to load configuration for ${node.type}`);
        }
        const schema = await response.json();
        setConfigSchema(schema);
      } catch (error) {
        console.error("Error loading node configuration:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchNodeConfig();
  }, [node.type]);

  const handleFieldChange = (fieldId: string, value: any) => {
    const updatedData = {
      ...localData,
      [fieldId]: value,
    };

    setLocalData(updatedData);

    onChange(updatedData);
  };

  if (isLoading) {
    return <div className="p-4 text-center">Loading configuration...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!configSchema || !configSchema.fields) {
    return (
      <div className="p-4 text-center">
        No configuration available for this node type
      </div>
    );
  }

  return (
    <div className="space-y-4" onClick={(e) => e.stopPropagation()}>
      {configSchema.fields.map((field: any) => (
        <div key={field.id} className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {field.label}
          </label>
          {renderField(field, localData, handleFieldChange)}
          {field.description && (
            <p className="mt-1 text-xs text-gray-500">{field.description}</p>
          )}
        </div>
      ))}

      {/* <details className="mt-4 text-xs">
        <summary className="cursor-pointer text-gray-500">Debug Info</summary>
        <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-40">
          {JSON.stringify(localData, null, 2)}
        </pre>
      </details> */}
    </div>
  );
};

function renderField(
  field: any,
  data: any,
  onFieldChange: (fieldId: string, value: any) => void
) {
  const value =
    data[field.id] !== undefined
      ? data[field.id]
      : field.defaultValue !== undefined
      ? field.defaultValue
      : "";

  switch (field.type) {
    case "text":
      return (
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-700 rounded-md !focus:ring-0 focus:outline-0"
          value={value}
          onChange={(e) => {
            e.stopPropagation();
            onFieldChange(field.id, e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      );
    case "number":
      return (
        <input
          type="number"
          className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-0"
          value={value}
          onChange={(e) => {
            e.stopPropagation();
            const numValue =
              e.target.value === "" ? "" : parseInt(e.target.value);
            onFieldChange(field.id, numValue);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      );
    case "select":
      return (
        <select
          className="w-full px-3 py-2 border border-gray-700 rounded-md focus:outline-0"
          value={value}
          onChange={(e) => {
            e.stopPropagation();
            onFieldChange(field.id, e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {field.options?.map((option: any) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case "code":
      return (
        <div className="border border-gray-700 rounded-md h-64">
          <MonacoEditor
            height="100%"
            language={field.language || "javascript"}
            theme="vs-dark"
            value={value}
            options={{
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              fontSize: 14,
              automaticLayout: true,
              lineNumbers: "off",
            }}
            onChange={(newValue) => {
              onFieldChange(field.id, newValue || "");
            }}
            onMount={(editor) => {
              editor.updateOptions({ tabSize: 2 });
            }}
          />
        </div>
      );
    case "checkbox":
      return (
        <input
          type="checkbox"
          className="h-4 w-4 border border-gray-700 rounded"
          checked={!!value}
          onChange={(e) => {
            e.stopPropagation();
            onFieldChange(field.id, e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()}
        />
      );
    default:
      return <div>Unknown field type: {field.type}</div>;
  }
}

export default NodeConfiguration;
