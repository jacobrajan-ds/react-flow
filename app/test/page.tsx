"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
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
import { FaBug, FaEyeSlash } from "react-icons/fa";
import Sidebar from "@/components/SideBar/SideBar";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

// Main Flow Editor component
function FlowEditor() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Memoize the sidebar to prevent re-renders
  const sidebar = useMemo(
    () => (
      <Sidebar
        isOpen={isSidebarOpen}
        toggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
    ),
    [isSidebarOpen]
  );

  return (
    <div className="flex h-screen">
      {sidebar}
      <div className={`flex-1 h-full ${isSidebarOpen ? "ml-64" : "ml-16"}`}>
        <ReactFlowProvider>
          <FlowContent isSidebarOpen={isSidebarOpen} />
        </ReactFlowProvider>
      </div>
    </div>
  );
}

// Separate component for the flow content
function FlowContent({ isSidebarOpen }) {
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
  const [isTransitioning, setIsTransitioning] = useState(false);

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
      setIsTransitioning(true);
      try {
        const response = await fetch(`/api/workflows/${id}`);
        if (response.ok) {
          const data = await response.json();
          setFlowId(id);
          // Use a small timeout to prevent flashing
          setTimeout(() => {
            setNodes(data.nodes || []);
            setEdges(data.edges || []);
            setIsTransitioning(false);
            setIsLoading(false);
          }, 100);
        } else if (response.status === 404) {
          // Workflow doesn't exist yet, initialize it
          console.log(`Workflow ${id} not found, initializing new workflow`);
          setFlowId(id);
          setNodes([]);
          setEdges([]);
          saveNewWorkflow(id);
          setTimeout(() => {
            setIsTransitioning(false);
            setIsLoading(false);
          }, 100);
        } else {
          console.error("Error loading workflow:", await response.text());
          setIsTransitioning(false);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading workflow:", error);
        setIsTransitioning(false);
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

  if (isLoading || isTransitioning) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c3a4c]">
        <div className="text-white text-xl">
          {isTransitioning ? <LoadingSpinner /> : "Loading workflow..."}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full w-full" onDrop={onDrop} onDragOver={onDragOver}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          onPaneClick={onPaneClick}
          onNodesChange={onNodesChange}
          fitView
        >
          <Background bgColor="#0c3a4c" color="#0d1521" size={2} gap={15} />
          <Controls position="bottom-right" orientation="horizontal" />

          <Panel position="top-left" className="m-4">
            <AddNodeButton nodeTypes={availableNodeTypes} />
          </Panel>

          <Panel
            position="top-right"
            className="bg-[#071026] p-3 rounded shadow-md"
          >
            <div className="flex gap-2">
              <SaveFlowButton flowId={flowId} />

              <button
                className="bg-gray-600 text-white px-2 py-2 rounded"
                onClick={() => setIsDebugVisible(!isDebugVisible)}
              >
                {isDebugVisible ? <FaEyeSlash /> : <FaBug />}
              </button>
              <ExecuteFlowButton
                flowId={flowId}
                onExecutionComplete={(result, executionLogs) => {
                  setExecutionResult(result);
                  setLogs(executionLogs);
                  setIsDebugVisible(true);
                }}
              />
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {selectedNode && (
        <div className="absolute right-0 top-0 w-80 h-full bg-[#0b253a] text-white overflow-auto">
          <div className="flex justify-between items-center mb-4 p-4 bg-[#071026]">
            <h3 className="text-lg font-bold">Node Configuration</h3>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setSelectedNode(null)}
            >
              ✕
            </button>
          </div>

          <div className="p-4">
            <NodeConfiguration
              node={selectedNode}
              onChange={handleNodeDataChange}
            />
          </div>
        </div>
      )}

      <DebugPanel
        logs={logs}
        result={executionResult}
        isVisible={isDebugVisible}
        onClose={() => setIsDebugVisible(false)}
      />
    </>
  );
}

export default FlowEditor;
