// app/components/SaveFlowButton.tsx
import React, { FC } from "react";
import { useReactFlow } from "@xyflow/react";
import { CustomNode, CustomEdge } from "@/app/types/flow";

interface SaveFlowButtonProps {
  flowId: string;
}

const SaveFlowButton: FC<SaveFlowButtonProps> = ({ flowId }) => {
  const { getNodes, getEdges } = useReactFlow<CustomNode, CustomEdge>();
  const [isSaving, setIsSaving] = React.useState(false);

  const saveFlow = async () => {
    setIsSaving(true);
    const nodes = getNodes();
    const edges = getEdges();

    try {
      const response = await fetch("/api/save-flow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          flowId,
          nodes,
          edges,
        }),
      });

      if (response.ok) {
        alert("Flow saved successfully!");
      } else {
        alert("Failed to save flow");
      }
    } catch (error) {
      console.error("Error saving flow:", error);
      alert("Error saving flow");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      className="bg-gray-600 text-white px-4 py-2 rounded disabled:bg-blue-400"
      onClick={saveFlow}
      disabled={isSaving}
    >
      {isSaving ? "Saving..." : "Save Flow"}
    </button>
  );
};

export default SaveFlowButton;
