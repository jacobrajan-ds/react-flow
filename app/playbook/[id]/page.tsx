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
  EdgeMouseHandler,
  Connection,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { v4 as uuidv4 } from "uuid";

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

import DynamicNode from "@/components/nodes/DynamicNode";
import DraggableNode from "@/components/DraggableNode";

import NodeConfiguration from "@/components/configurations/NodeConfiguration";
import DebugPanel from "@/components/DebugPanel";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Sidebar from "@/components/Sidebar";
import AddNodeButton from "@/components/AddNodeButton";
import EdgePanel from "@/components/EdgePanel";

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
  animated?: boolean;
  strokeWidth?: number;
  color?: string;
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

const generateUniqueId = () => {
  return `node-${uuidv4()}`;
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
  const [selectedEdge, setSelectedEdge] = useState<PlaybookEdge | null>(null);
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
  const [isEdgePanelOpen, setIsEdgePanelOpen] = useState(false);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const playbookId = params.id as string;
  const versionId = searchParams.get("version");

  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    const defaultNodeTypes: NodeTypes = {
      dynamicNode: DynamicNode,
    };
    setNodeTypes(defaultNodeTypes);
  }, []);

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

  async function loadPlaybook() {
    if (!playbookId) return;

    setIsTransitioning(true);
    try {
      let nodeTypesData = availableNodeTypes;
      if (availableNodeTypes.length === 0) {
        const nodeTypesResponse = await axiosInstance.get("/api/app");
        if (nodeTypesResponse.status === 200) {
          nodeTypesData = nodeTypesResponse.data;
          setAvailableNodeTypes(nodeTypesData);
        }
      }

      const response = await axiosInstance.get(
        `/api/playbook-version/${playbookId}`
      );

      if (response.status === 200) {
        const playbookData = response.data;
        console.log("Loaded playbook data:", playbookData);
        setPlaybook(playbookData);

        const version = playbookData;

        if (version) {
          setActiveVersion(version);

          const transformedNodes = version.nodes.map((node) => {
            const nodeTypeName = node.data?.label;

            console.log(`Processing node: ${node.id}, type: ${nodeTypeName}`);

            const nodeTypeConfig = nodeTypesData.find(
              (type) => type.name === nodeTypeName
            );

            if (!nodeTypeConfig) {
              console.warn(
                `No node type configuration found for: ${nodeTypeName}`
              );
            } else {
              console.log(`Found configuration for node type ${nodeTypeName}`);
            }

            const fieldDefinitions =
              nodeTypeConfig?.config_schema?.fields || [];

            const existingValues = {};

            if (node.data) {
              Object.keys(node.data).forEach((key) => {
                if (key !== "label" && key !== "description") {
                  existingValues[key] = node.data[key];
                }
              });
            }

            console.log(`Node ${node.id} existing values:`, existingValues);

            const nodeData = {
              label: node.data?.label || "",
              description:
                node.data?.description ||
                nodeTypeConfig?.config_schema?.description ||
                "",

              config: fieldDefinitions,

              values: existingValues,

              nodeTypeInfo: nodeTypeConfig,
            };

            if (fieldDefinitions.length > 0) {
              fieldDefinitions.forEach((field) => {
                if (nodeData.values[field.name] === undefined) {
                  if (field.type === "choice" && field.options?.length) {
                    nodeData.values[field.name] = field.options[0];
                  } else if (field.default !== undefined) {
                    nodeData.values[field.name] = field.default;
                  }
                }
              });
            }

            return {
              ...node,
              id: node.id,
              type: "dynamicNode",
              position: node.position || { x: 0, y: 0 },
              data: nodeData,
            };
          });

          const transformedEdges = version.edges.map((edge) => ({
            ...edge,
            id: edge.id,
            source: edge.source,
            target: edge.target,
            sourceHandle: edge.sourceHandle,
            targetHandle: edge.targetHandle,
            animated: true, // Initially set animated to true for marching ants
            strokeWidth: edge.strokeWidth || 1,
            color: edge.color || "#000000",
          }));

          if (transformedNodes.length > 0) {
            console.log("Sample transformed node:", transformedNodes[0]);
          }

          setTimeout(() => {
            setNodes(transformedNodes);
            setEdges(transformedEdges);
            setIsTransitioning(false);
            setIsLoading(false);
          }, 100);
        } else {
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

  useEffect(() => {
    loadPlaybook();
  }, [playbookId]);

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNode(node as PlaybookNode);
  }, []);

  const onEdgeClick: EdgeMouseHandler = useCallback((_, edge) => {
    setSelectedEdge(edge as PlaybookEdge);
    setIsEdgePanelOpen(true);
  }, []);

  const onConnect: OnConnect = useCallback((params: Connection) => {
    const newEdge: PlaybookEdge = {
      ...params,
      id: `edge-${Date.now()}`,
      source: params.source || "",
      target: params.target || "",
      sourceHandle: params.sourceHandle || undefined,
      targetHandle: params.targetHandle || undefined,
      animated: true, // Initially set animated to true for marching ants
      strokeWidth: 1,
      color: "#000000",
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, []);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => {
      const newNodes = applyNodeChanges(changes, nds);
      const deletedNodeIds = changes
        .filter((change) => change.type === "remove")
        .map((change) => change.id);
      setEdges((eds) =>
        eds.filter(
          (edge) =>
            !deletedNodeIds.includes(edge.source) &&
            !deletedNodeIds.includes(edge.target)
        )
      );
      return newNodes;
    });
  }, []);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

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
                values: {
                  ...node.data.values,
                  ...updatedData.values,
                },
              },
            };
          }
          return node;
        })
      );
    },
    [selectedNode]
  );

  const handleEdgeDataChange = useCallback(
    (updatedData: any) => {
      if (!selectedEdge) return;

      setEdges((eds) =>
        eds.map((edge) => {
          if (edge.id === selectedEdge.id) {
            return {
              ...edge,
              ...updatedData,
            };
          }
          return edge;
        })
      );
    },
    [selectedEdge]
  );

  const groupNodesByType = (nodes: NodeTypeConfig[]) => {
    const groups: Record<string, NodeTypeConfig[]> = {};

    nodes.forEach((node) => {
      const groupKey = node.group || node.app_type || "Other";

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }

      groups[groupKey].push(node);
    });

    return groups;
  };

  const onDragStart = useCallback(
    (event: React.DragEvent, nodeType: string, nodeInfo: NodeTypeConfig) => {
      event.dataTransfer.setData(
        "application/reactflow",
        JSON.stringify({ nodeType, nodeInfo })
      );
      event.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const dragData = event.dataTransfer.getData("application/reactflow");

      if (!dragData) return;

      try {
        const { nodeType, nodeInfo } = JSON.parse(dragData);

        const position = reactFlowInstance.screenToFlowPosition({
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        });

        const nodeData = {
          label: nodeInfo.name || nodeType,
          description: nodeInfo.config_schema?.description || "",
          config: nodeInfo.config_schema?.fields || [],
          values: {},
        };

        const newNode = {
          id: generateUniqueId(),
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

  const saveWorkflow = useCallback(async () => {
    if (!playbookId || !activeVersion) {
      console.error("Missing playbookId or activeVersion");
      return;
    }

    setIsSaving(true);
    try {
      const formattedNodes = nodes.map((node) => ({
        id: node.id,
        type:
          node.type === "dynamicNode" ? node.data.nodeInfo?.name : node.type,
        position: node.position,
        data: {
          label: node.data.label,
          description: node.data.description,
          ...node.data.values,
        },
      }));

      const formattedEdges = edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
        label: edge.label,
        animated: edge.animated,
        strokeWidth: edge.strokeWidth,
        color: edge.color,
      }));

      const payload = {
        playbook_id: playbookId,
        version_id: activeVersion.id,
        nodes: formattedNodes,
        edges: formattedEdges,
      };

      console.log("Saving workflow with payload:", payload);

      const response = await axiosInstance.patch(
        `/api/playbook/save-playbook/${activeVersion.id}`,
        payload
      );

      if (response && response.status >= 200 && response.status < 300) {
        console.log("Workflow saved successfully:", response.data);

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

  const handleBackToWorkflows = () => {
    router.push("/");
  };

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
      <div className="flex-1 h-full overflow-hidden flex flex-col">
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

        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background bgColor="#0c3a4c" color="#0d1521" size={2} gap={15} />
            <Controls
              position="bottom-center"
              orientation="horizontal"
              className="p-2 rounded-md"
              style={{
                backgroundColor: "#071026 !important",
              }}
            />
            <Panel position="top-left" className="m-4">
              <AddNodeButton nodeTypes={availableNodeTypes} />
            </Panel>

            <Panel position="top-right" className="m-4">
              <button
                onClick={() => setIsDebugVisible(!isDebugVisible)}
                className="bg-[#071026]/80  text-white p-2 rounded-lg border border-[#00F6FF]/10 hover:bg-[#0A162E] transition-colors"
              >
                {isDebugVisible ? <EyeOff size={18} /> : <Bug size={18} />}
              </button>
            </Panel>

            <Panel
              position="top-right"
              className="max-h-[calc(100vh-60px)] overflow-auto"
            >
              {selectedNode && (
                <div className="w-80 bg-[#0b253a] rounded-xl text-white shadow-xl">
                  <div className="">
                    <div className="flex justify-between items-center p-4 bg-[#071026] border-b border-[#00F6FF]/10 rounded-t-xl">
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

                    <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                      <NodeConfiguration
                        node={selectedNode}
                        onChange={handleNodeDataChange}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Panel>
          </ReactFlow>
        </div>
      </div>

      {/* {selectedNode && (
        <div className="relative">
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
        </div>
      )} */}

      {/* <div className="fixed top-0 left-0 m-4">
        {isEdgePanelOpen && (
          <EdgePanel
            isOpen={isEdgePanelOpen}
            onClose={() => setIsEdgePanelOpen(false)}
            position={{ x: 0, y: 0 }}
            edgeData={selectedEdge}
            onEdgeDataChange={handleEdgeDataChange}
          />
        )}
      </div> */}

      <DebugPanel
        logs={logs}
        result={executionResult}
        isVisible={isDebugVisible}
        onClose={() => setIsDebugVisible(false)}
      />
    </div>
  );
}
