"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
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
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import axiosInstance from "@/utils/axios";
import {
  Save,
  Play,
  Bug,
  EyeOff,
  Plus,
  ChevronLeft,
  Settings,
} from "lucide-react";

// Import your dynamic node component
import DynamicNode from "@/components/nodes/DynamicNode";
import DraggableNode from "@/components/DraggableNode";

// Import other necessary components
import NodeConfiguration from "@/components/configurations/NodeConfiguration";
import DebugPanel from "@/components/DebugPanel";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Sidebar from "@/components/Sidebar";

// Types definitions for the component
interface PlaybookNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: any;
  measured?: { width: number; height: number };
  style?: any;
  selected?: boolean;
  dragging?: boolean;
}

interface PlaybookEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  sourceHandle?: string;
  targetHandle?: string;
  data?: any;
}

interface PlaybookVersion {
  id: string;
  version_number: number;
  execution_mode: string;
  module_code: string;
  webhook_id: string;
  is_latest: boolean;
  is_active: boolean;
  playbook_id: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  deleted_at: string | null;
  deleted_by: string | null;
  playbook_node_version: PlaybookNode[];
  execution: any[];
  edge: PlaybookEdge[];
}

interface Playbook {
  id: string;
  name: string;
  description: string;
  collection_id: string;
  owner_id: string;
  playbook_version: PlaybookVersion[];
}

interface NodeTypeConfig {
  id: string;
  name: string;
  group: string;
  category: string;
  app_type: string;
  is_custom: boolean;
  config_schema: {
    name: string;
    fields: Array<{
      name: string;
      type: string;
      default?: any;
      description: string;
      required?: boolean;
      options?: string[];
    }>;
    description: string;
  };
  version: string;
  icon: string;
  reference_code: string;
  code: string;
  is_active: boolean;
}

// Helper function to generate unique IDs
const generateUniqueId = () => {
  return `node-${Math.random().toString(36).substr(2, 9)}`;
};

export default function PlaybookPage() {
  return (
    <ReactFlowProvider>
      <PlaybookContent />
    </ReactFlowProvider>
  );
}

function PlaybookContent() {
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [activeVersion, setActiveVersion] = useState<PlaybookVersion | null>(
    null
  );
  const [nodes, setNodes] = useState<PlaybookNode[]>([]);
  const [edges, setEdges] = useState<PlaybookEdge[]>([]);
  const [selectedNode, setSelectedNode] = useState<PlaybookNode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [nodeTypes, setNodeTypes] = useState<NodeTypes>({});
  const [availableNodeTypes, setAvailableNodeTypes] = useState<
    NodeTypeConfig[]
  >([]);

  // Ref for the ReactFlow wrapper div
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const playbookId = params.id as string;
  const versionId = searchParams.get("version");

  const reactFlowInstance = useReactFlow();

  // Initialize node types
  useEffect(() => {
    const defaultNodeTypes: NodeTypes = {
      // Use the dynamic node for all node types
      dynamicNode: DynamicNode,
    };
    setNodeTypes(defaultNodeTypes);
  }, []);

  // Fetch node types from API
  useEffect(() => {
    async function fetchNodeTypes() {
      try {
        const response = await axiosInstance.get("/api/app");
        if (response.status === 200) {
          setAvailableNodeTypes(response.data);
        }
      } catch (error) {
        console.error("Error loading node types:", error);
      }
    }

    fetchNodeTypes();
  }, []);

  // Load playbook data
  useEffect(() => {
    async function loadPlaybook() {
      if (!playbookId) return;

      setIsTransitioning(true);
      try {
        const response = await axiosInstance.get(
          `/api/playbook-version/${playbookId}`
        );
        if (response.status === 200) {
          const playbookData = response.data;

          console.log(playbookData);
          setPlaybook(playbookData);

          // Determine which version to load
          let version;
          if (versionId) {
            // Load specific version if provided in query params
            version = playbookData.playbook_version.find(
              (v) => v.id === versionId
            );
          } else {
            // Otherwise load the latest version
            version = playbookData.playbook_version.find((v) => v.is_latest);
          }

          if (version) {
            setActiveVersion(version);

            // Transform nodes and edges for ReactFlow
            const transformedNodes = version.playbook_node_version.map(
              (node) => ({
                ...node,
                // Ensure required properties for ReactFlow nodes
                id: node.id,
                // Use the dynamic node type for all nodes
                type: "dynamicNode",
                position: node.position || { x: 0, y: 0 },
                data: {
                  ...node.data,
                  nodeInfo: node.data.nodeInfo || {
                    app_type: node.data.app_type || "PROCESS",
                    name: node.data.label || "Node",
                  },
                },
              })
            );

            const transformedEdges = version.edge.map((edge) => ({
              ...edge,
              // Ensure required properties for ReactFlow edges
              id: edge.id,
              source: edge.source,
              target: edge.target,
              sourceHandle: edge.sourceHandle,
              targetHandle: edge.targetHandle,
            }));

            setTimeout(() => {
              setNodes(transformedNodes);
              setEdges(transformedEdges);
              setIsTransitioning(false);
              setIsLoading(false);
            }, 100);
          } else {
            // No version found
            console.warn("No version found for this playbook");
            setIsTransitioning(false);
            setIsLoading(false);
          }
        } else {
          console.error("Error loading playbook:", response.statusText);
          setIsTransitioning(false);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading playbook:", error);
        setIsTransitioning(false);
        setIsLoading(false);
      }
    }

    loadPlaybook();
  }, [playbookId, versionId]);

  // Handle node selection
  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNode(node as PlaybookNode);
  }, []);

  // Handle connection between nodes
  const onConnect: OnConnect = useCallback((params: Connection) => {
    const newEdge: PlaybookEdge = {
      ...params,
      id: `edge-${Date.now()}`,
      source: params.source || "",
      target: params.target || "",
      sourceHandle: params.sourceHandle || undefined,
      targetHandle: params.targetHandle || undefined,
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, []);

  // Handle node changes (moving, selecting)
  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  // Handle pane click (deselect node)
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Handle node configuration changes
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

  // Group nodes by type for the panel
  const groupNodesByType = (nodes: NodeTypeConfig[]) => {
    const groups: Record<string, NodeTypeConfig[]> = {};

    nodes.forEach((node) => {
      // Group by group property first, fallback to app_type
      const groupKey = node.group || node.app_type || "Other";

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(node);
    });

    return groups;
  };

  // Handle when drag starts on a node in the sidebar
  const onDragStart = useCallback(
    (event: React.DragEvent, nodeType: string, nodeInfo: NodeTypeConfig) => {
      // Set the drag data
      event.dataTransfer.setData(
        "application/reactflow",
        JSON.stringify({ nodeType, nodeInfo })
      );
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  // Handle when drag is over the ReactFlow area
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle when a node is dropped onto the ReactFlow area
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const dragData = event.dataTransfer.getData("application/reactflow");

      // If no drag data or invalid data, return
      if (!dragData) return;

      try {
        const { nodeType, nodeInfo } = JSON.parse(dragData);

        // Calculate the position of the drop relative to the ReactFlow viewport
        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        // Create node data with configuration from the API
        const nodeData = {
          label: nodeInfo.name || nodeType,
          description: nodeInfo.config_schema?.description || "",
          // Add config schema fields
          config: nodeInfo.config_schema?.fields || [],
          // Initialize with empty values
          values: {},
          // Store the original node info for reference
          nodeInfo: nodeInfo,
        };

        const newNode = {
          id: generateUniqueId(),
          // Always use the dynamic node type
          type: "dynamicNode",
          position,
          data: nodeData,
        };

        setNodes((nds) => [...nds, newNode]);
      } catch (error) {
        console.error("Could not parse drag data", error);
      }
    },
    [reactFlowInstance]
  );

  // Save the workflow
  const saveWorkflow = useCallback(async () => {
    if (!playbookId || !activeVersion) {
      console.error("Missing playbookId or activeVersion");
      return;
    }

    setIsSaving(true);
    try {
      // Format nodes and edges for API
      const formattedNodes = nodes.map((node) => ({
        id: node.id,
        type:
          node.type === "dynamicNode" ? node.data.nodeInfo?.name : node.type,
        position: node.position,
        data: {
          label: node.data.label,
          description: node.data.description,
          // Include node configuration values
          ...node.data.values,
          // Include nodeInfo for reference but remove code field to reduce payload size
          nodeInfo: node.data.nodeInfo
            ? {
                ...node.data.nodeInfo,
                code: undefined, // Remove code to reduce payload size
              }
            : undefined,
        },
      }));

      const formattedEdges = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
      }));

      const payload = {
        playbook_id: playbookId,
        version_id: activeVersion.id,
        nodes: formattedNodes,
        edges: formattedEdges,
      };

      console.log("Saving workflow with payload:", payload);

      // Send the API request
      const response = await axiosInstance.patch(
        `/api/playbook-version/${activeVersion.id}`,
        payload
      );

      if (response && response.status >= 200 && response.status < 300) {
        console.log("Workflow saved successfully:", response.data);

        // Optionally update workflow state with the response
        if (response.data && response.data.updated_at) {
          setActiveVersion((prev) =>
            prev
              ? {
                  ...prev,
                  updated_at: response.data.updated_at,
                }
              : null
          );
        }
      } else {
        throw new Error(`Failed to save workflow: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error saving workflow:", error);
    } finally {
      setIsSaving(false);
    }
  }, [playbookId, activeVersion, nodes, edges]);

  // Execute the workflow
  const executeWorkflow = useCallback(async () => {
    if (!playbookId || !activeVersion) return;

    setIsExecuting(true);
    setLogs([]);
    setExecutionResult(null);

    try {
      const response = await axiosInstance.post(
        `/api/playbook/${playbookId}/execute`,
        {
          version_id: activeVersion.id,
        }
      );

      if (response.status === 200) {
        const result = response.data;
        setExecutionResult(result);
        setLogs(result.logs || []);
        setIsDebugVisible(true);
      } else {
        console.error("Error executing workflow");
        setLogs(["Error executing workflow"]);
        setIsDebugVisible(true);
      }
    } catch (error: any) {
      console.error("Error executing workflow:", error);
      setLogs([`Error: ${error.message || "Unknown error"}`]);
      setIsDebugVisible(true);
    } finally {
      setIsExecuting(false);
    }
  }, [playbookId, activeVersion]);

  // Handle going back to workflows page
  const handleBackToWorkflows = () => {
    router.push("/workflows");
  };

  // Render loading state
  if (isLoading || isTransitioning) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0c3a4c]">
        <div className="text-white text-xl">
          {isTransitioning ? <LoadingSpinner /> : "Loading playbook..."}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#131B2F] text-white">
      {/* <Sidebar /> */}

      <div className="flex-1 h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#071026] p-4 border-b border-[#00F6FF]/10 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={handleBackToWorkflows}
              className="mr-4 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold">
                {playbook?.name || "Playbook"}
              </h1>
              <div className="text-sm text-gray-400">
                Version: {activeVersion?.version_number || 1} •
                {activeVersion?.is_latest ? " Latest" : ""} •
                {activeVersion?.is_active ? " Active" : " Inactive"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={saveWorkflow}
              disabled={isSaving}
              className="bg-[#0A162E] text-[#00F6FF] hover:bg-[#071026] px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
            >
              {isSaving ? <LoadingSpinner size="sm" /> : <Save size={16} />}
              <span>Save</span>
            </button>

            <button
              onClick={executeWorkflow}
              disabled={isExecuting}
              className="bg-gradient-to-r from-[#00F6FF] to-[#61DDFF] text-[#071026] font-medium px-4 py-2 rounded-md flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              {isExecuting ? (
                <LoadingSpinner size="sm" color="dark" />
              ) : (
                <Play size={16} />
              )}
              <span>Execute</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background bgColor="#0c3a4c" color="#0d1521" size={2} gap={15} />
            <Controls position="bottom-right" orientation="horizontal" />

            {/* Add node panel */}
            <Panel position="top-left" className="m-4">
              <div className="bg-[#071026]/80 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-[#00F6FF]/10">
                <div className="text-sm text-gray-400 mb-2 px-2">Add Node</div>

                {/* Group nodes by type */}
                {Object.entries(groupNodesByType(availableNodeTypes)).map(
                  ([group, nodes]) => (
                    <div key={group} className="mb-3">
                      <div className="text-xs text-gray-400 mb-1 px-2 uppercase">
                        {group}
                      </div>
                      <div className="flex flex-wrap gap-2 max-w-[400px]">
                        {nodes.map((nodeType) => (
                          <DraggableNode
                            key={nodeType.id}
                            type={nodeType.name}
                            label={nodeType.name}
                            nodeInfo={nodeType}
                            onDragStart={onDragStart}
                          />
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            </Panel>

            {/* Debug panel toggle */}
            <Panel position="top-right" className="m-4">
              <button
                onClick={() => setIsDebugVisible(!isDebugVisible)}
                className="bg-[#071026]/80 backdrop-blur-sm text-white p-2 rounded-lg border border-[#00F6FF]/10 hover:bg-[#0A162E] transition-colors"
              >
                {isDebugVisible ? <EyeOff size={18} /> : <Bug size={18} />}
              </button>
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* Node configuration sidebar */}
      {selectedNode && (
        <div className="absolute right-0 top-0 w-80 h-full bg-[#0b253a] text-white overflow-auto shadow-xl">
          <div className="flex justify-between items-center p-4 bg-[#071026] border-b border-[#00F6FF]/10">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Settings size={16} />
              Node Configuration
            </h3>
            <button
              className="text-gray-400 hover:text-white"
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

      {/* Debug panel */}
      <DebugPanel
        logs={logs}
        result={executionResult}
        isVisible={isDebugVisible}
        onClose={() => setIsDebugVisible(false)}
      />
    </div>
  );
}
