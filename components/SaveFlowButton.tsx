import React, { FC, useEffect, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { CustomNode, CustomEdge } from "@/app/types/flow";
import { FaCheck, FaSave } from "react-icons/fa";
import { MdDataSaverOff } from "react-icons/md";

interface SaveFlowButtonProps {
  flowId: string;
}

const SaveFlowButton: FC<SaveFlowButtonProps> = ({ flowId }) => {
  const { getNodes, getEdges } = useReactFlow<CustomNode, CustomEdge>();
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [workflowTitle, setWorkflowTitle] = useState("");

  useEffect(() => {
    async function fetchWorkflowTitle() {
      try {
        const response = await fetch(`/api/workflows/${flowId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.title) {
            setWorkflowTitle(data.title);
          }
        }
      } catch (error) {
        console.error("Error fetching workflow title:", error);
      }
    }

    if (flowId) {
      fetchWorkflowTitle();
    }
  }, [flowId]);

  const saveFlow = async () => {
    if (!flowId) return;

    setIsSaving(true);
    setSaveStatus("idle");

    const nodes = getNodes();
    const edges = getEdges();

    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: flowId,
          nodes,
          edges,
          title: workflowTitle || `Workflow ${flowId.substring(0, 8)}`,
        }),
      });

      if (response.ok) {
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error saving flow:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="relative">
      <button
        className={`px-2 py-2 rounded ${
          saveStatus === "success"
            ? "bg-green-500 text-white"
            : saveStatus === "error"
            ? "bg-red-500 text-white"
            : "bg-gray-600 text-white"
        } disabled:bg-gray-400`}
        onClick={saveFlow}
        disabled={isSaving}
      >
        {isSaving ? (
          <div className="animate-spin">
            <MdDataSaverOff />
          </div>
        ) : saveStatus === "success" ? (
          <div className="">
            <FaCheck />
          </div>
        ) : saveStatus === "error" ? (
          "Failed!"
        ) : (
          <FaSave />
        )}
      </button>
    </div>
  );
};

export default SaveFlowButton;
