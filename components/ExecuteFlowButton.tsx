import React, { FC, useState } from "react";
import { useReactFlow } from "@xyflow/react";
import { CustomNode, CustomEdge } from "@/app/types/flow";

interface ExecuteFlowButtonProps {
  flowId: string;
  onExecutionComplete?: (result: any, logs: string[]) => void;
}

const ExecuteFlowButton: FC<ExecuteFlowButtonProps> = ({
  flowId,
  onExecutionComplete,
}) => {
  const { getNodes, getEdges, setNodes } = useReactFlow<
    CustomNode,
    CustomEdge
  >();
  const [isExecuting, setIsExecuting] = useState(false);

  const executeFlow = async () => {
    setIsExecuting(true);

    try {
      const nodes = getNodes();
      const httpInNodes = nodes.filter((node) => node.type === "httpIn");

      if (httpInNodes.length === 0) {
        alert("No HTTP In nodes found to start execution");
        setIsExecuting(false);
        return;
      }

      const startNode = httpInNodes[0];

      await saveFlow(flowId, nodes, getEdges());

      setNodes((nodes) =>
        nodes.map((node) => ({
          ...node,
          style: {
            ...node.style,
            boxShadow:
              node.id === startNode.id
                ? "0 0 10px 5px rgba(255, 165, 0, 0.75)"
                : undefined,
          },
        }))
      );

      const response = await fetch(
        `/api/execute-flow?flowId=${flowId}&nodeId=${startNode.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: "hello world",
            number: 42,
            items: ["apple", "banana", "cherry"],
            active: true,
            metadata: {
              source: "user input",
              priority: "high",
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (onExecutionComplete) {
          onExecutionComplete(data.result, data.logs || []);
        }
      } else {
        const error = await response.json();
        if (onExecutionComplete) {
          onExecutionComplete(
            { error: error.message || "Execution failed" },
            []
          );
        }
      }
    } catch (error) {
      console.error("Error executing flow:", error);
      if (onExecutionComplete) {
        onExecutionComplete({ error: "Execution failed" }, []);
      }
    } finally {
      setIsExecuting(false);

      setNodes((nodes) =>
        nodes.map((node) => ({
          ...node,
          style: {
            ...node.style,
            boxShadow: undefined,
          },
        }))
      );
    }
  };

  const saveFlow = async (
    flowId: string,
    nodes: CustomNode[],
    edges: CustomEdge[]
  ) => {
    try {
      await fetch("/api/save-flow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ flowId, nodes, edges }),
      });
    } catch (error) {
      console.error("Error saving flow:", error);
    }
  };

  return (
    <button
      className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      onClick={executeFlow}
      disabled={isExecuting}
    >
      {isExecuting ? "Executing..." : "Execute Flow"}
    </button>
  );
};

export default ExecuteFlowButton;
