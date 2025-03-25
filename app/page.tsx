"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  Background,
  Controls,
  Panel,
  useReactFlow,
  NodeTypes,
  OnConnect,
  NodeMouseHandler,
  Connection,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter, useSearchParams } from "next/navigation";

import { CustomNode, CustomEdge, NodeTypeDefinition } from "./types/flow";
import FunctionNode from "@/components/nodes/FunctionNode";
import HttpResponseNode from "@/components/nodes/HttpResponseNode";
import HttpInNode from "@/components/nodes/HttpInNode";
import NodePanel from "@/components/NodePanel";
import SaveFlowButton from "@/components/SaveFlowButton";
import ExecuteFlowButton from "@/components/ExecuteFlowButton";
import NodeConfiguration from "@/components/configurations/NodeConfiguration";
import DebugPanel from "@/components/DebugPanel";
import AddNodeButton from "@/components/AddNodeButton";

function Flow() {
  const [nodes, setNodes] = useState<CustomNode[]>([]);
  const [edges, setEdges] = useState<CustomEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);
  const [flowId, setFlowId] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [nodeTypes, setNodeTypes] = useState<NodeTypes>({});
  const [availableNodeTypes, setAvailableNodeTypes] = useState<
    NodeTypeDefinition[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const reactFlowInstance = useReactFlow();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workflowIdParam = searchParams.get("id");

  useEffect(() => {
    const defaultNodeTypes: NodeTypes = {
      httpIn: HttpInNode,
      httpResponse: HttpResponseNode,
      function: FunctionNode,
    };
    setNodeTypes(defaultNodeTypes);
  }, []);

  useEffect(() => {
    async function fetchNodeTypes() {
      try {
        const response = await fetch("/api/node-types");
        if (!response.ok) throw new Error("Failed to fetch node types");
        const data = await response.json();
        setAvailableNodeTypes(data);
      } catch (error) {
        console.error("Error loading node types:", error);
      }
    }

    fetchNodeTypes();
  }, []);

  useEffect(() => {
    async function loadWorkflow(id: string) {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/workflows/${id}`);
        if (response.ok) {
          const data = await response.json();
          setFlowId(id);
          setNodes(data.nodes || []);
          setEdges(data.edges || []);
        } else if (response.status === 404) {
          // Workflow doesn't exist yet, initialize it
          console.log(`Workflow ${id} not found, initializing new workflow`);
          setFlowId(id);
          setNodes([]);
          setEdges([]);
          saveNewWorkflow(id);
        } else {
          console.error("Error loading workflow:", await response.text());
        }
      } catch (error) {
        console.error("Error loading workflow:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (workflowIdParam) {
      loadWorkflow(workflowIdParam);
    } else {
      const newFlowId = `flow-${Date.now()}`;
      setFlowId(newFlowId);
      router.push(`?id=${newFlowId}`);
      setNodes([]);
      setEdges([]);
      saveNewWorkflow(newFlowId);
      setIsLoading(false);
    }
  }, [workflowIdParam, router]);

  const saveNewWorkflow = async (id: string) => {
    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          nodes: [],
          edges: [],
        }),
      });

      if (!response.ok) {
        console.error("Failed to initialize workflow:", await response.text());
      } else {
        console.log("New workflow initialized:", id);
      }
    } catch (error) {
      console.error("Error initializing workflow:", error);
    }
  };

  const onConnect: OnConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge(params, eds));
  }, []);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNode(node as CustomNode);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onPaneClick = useCallback((event: React.MouseEvent) => {
    setSelectedNode(null);
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData("application/reactflow");
      if (!nodeType) return;

      // Get the current pane position
      const reactFlowBounds = document
        .querySelector(".react-flow")
        ?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      try {
        const response = await fetch(`/api/node-config/${nodeType}`);
        if (!response.ok) throw new Error("Failed to fetch node config");
        const configSchema = await response.json();

        const defaultData: any = {
          label: configSchema.defaultLabel || `${nodeType} node`,
        };

        if (configSchema.fields) {
          configSchema.fields.forEach((field: any) => {
            if (field.defaultValue !== undefined) {
              defaultData[field.id] = field.defaultValue;
            }
          });
        }

        const newNode = {
          id: `${nodeType}-${Date.now()}`,
          type: nodeType,
          position,
          data: defaultData,
        };

        setNodes((nds) => nds.concat(newNode as CustomNode));
      } catch (error) {
        console.error("Error creating node:", error);
      }
    },
    [reactFlowInstance]
  );

  const onNodesChange = (changes: any) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  };

  const handleNodeDataChange = useCallback(
    (updatedData: any) => {
      if (!selectedNode) return;

      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === selectedNode.id) {
            return {
              ...node,
              data: {
                ...node.data,
                ...updatedData,
              },
            };
          }
          return node;
        })
      );
    },
    [selectedNode]
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        Loading workflow...
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      <div className="flex-1 h-full" onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          onPaneClick={onPaneClick}
          onNodesChange={onNodesChange}
        >
          <Background />
          <Controls />

          <Panel position="top-left" className="m-4">
            <AddNodeButton nodeTypes={availableNodeTypes} />
          </Panel>

          <Panel
            position="top-right"
            className="bg-white p-3 rounded shadow-md"
          >
            <div className="flex gap-2">
              <SaveFlowButton flowId={flowId} />
              <ExecuteFlowButton
                flowId={flowId}
                onExecutionComplete={(result, executionLogs) => {
                  setExecutionResult(result);
                  setLogs(executionLogs);
                  setIsDebugVisible(true);
                }}
              />
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded"
                onClick={() => setIsDebugVisible(!isDebugVisible)}
              >
                {isDebugVisible ? "Hide" : "Show"} Debug Panel
              </button>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {selectedNode && (
        <div className="w-80 bg-gray-100 p-4 overflow-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">Node Configuration</h3>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedNode(null)}
            >
              ✕
            </button>
          </div>
          <NodeConfiguration
            node={selectedNode}
            onChange={handleNodeDataChange}
          />
        </div>
      )}

      <DebugPanel
        logs={logs}
        result={executionResult}
        isVisible={isDebugVisible}
        onClose={() => setIsDebugVisible(false)}
      />
    </div>
  );
}

export default function FlowEditor() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
