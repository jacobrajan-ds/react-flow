"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Panel,
  useReactFlow,
  NodeTypes,
  OnConnect,
  NodeMouseHandler,
  Connection,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import {
  CustomNode,
  CustomEdge,
  HttpInData,
  HttpResponseData,
  FunctionData,
} from "./types/flow";
import FunctionNode from "@/components/nodes/FunctionNode";
import HttpResponseNode from "@/components/nodes/HttpResponseNode";
import HttpInNode from "@/components/nodes/HttpInNode";
import NodePanel from "@/components/NodePanel";
import SaveFlowButton from "@/components/SaveFlowButton";
import ExecuteFlowButton from "@/components/ExecuteFlowButton";
import NodeConfiguration from "@/components/configurations/NodeConfiguration";
import DebugPanel from "@/components/DebugPanel";
import AddNodeButton from "@/components/AddNodeButton";

const initialNodes: CustomNode[] = [
  {
    id: "http-in-1",
    type: "httpIn",
    position: { x: 100, y: 100 },
    data: {
      label: "API Endpoint",
      method: "POST",
      url: "/api/process-data",
    },
  },
  {
    id: "function-1",
    type: "function",
    position: { x: 400, y: 100 },
    data: {
      label: "Process Data",
      functionBody: `
module.exports = function(msg) {
  // Get the input data
  const data = msg.payload;
  
  // Process the data
  let result = {
    processed: true,
    timestamp: new Date().toISOString(),
    originalData: data,
    uppercase: typeof data.text === 'string' ? data.text.toUpperCase() : null,
    numberTimesTwo: typeof data.number === 'number' ? data.number * 2 : null,
    itemCount: Array.isArray(data.items) ? data.items.length : 0
  };
  
  // Update the payload
  msg.payload = result;
  
  return msg;
}
      `,
    },
  },
  {
    id: "http-response-1",
    type: "httpResponse",
    position: { x: 700, y: 100 },
    data: {
      label: "Send Response",
      statusCode: 200,
      contentType: "application/json",
    },
  },
];

const initialEdges: CustomEdge[] = [
  {
    id: "edge-1",
    source: "http-in-1",
    target: "function-1",
    type: "animated",
  },
  {
    id: "edge-2",
    source: "function-1",
    target: "http-response-1",
    type: "animated",
  },
];

const nodeTypes: NodeTypes = {
  httpIn: HttpInNode,
  httpResponse: HttpResponseNode,
  function: FunctionNode,
};

function Flow() {
  const [nodes, setNodes] = useState<CustomNode[]>(initialNodes);
  const [edges, setEdges] = useState<CustomEdge[]>(initialEdges);
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);
  const [flowId] = useState(`flow-${Date.now()}`);
  const [logs, setLogs] = useState<string[]>([]);
  const [isDebugVisible, setIsDebugVisible] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    const saveInitialFlow = async () => {
      try {
        await fetch("/api/save-flow", {
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
        console.log("Initial flow saved");
      } catch (error) {
        console.error("Error saving initial flow:", error);
      }
    };

    saveInitialFlow();
  }, [flowId]);

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
    (event: React.DragEvent<HTMLDivElement>) => {
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

      const newNode = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: getDefaultDataForNodeType(nodeType),
      };

      setNodes((nds) => nds.concat(newNode as CustomNode));
    },
    [reactFlowInstance]
  );

  const onNodesChange = (changes: any) => {
    // This handler processes node changes including position changes
    setNodes((nds) => applyNodeChanges(changes, nds));
  };

  // Helper function to get default data based on node type
  const getDefaultDataForNodeType = (type: string) => {
    switch (type) {
      case "httpIn":
        return { label: "HTTP In", method: "GET", url: "/api" } as HttpInData;
      case "httpResponse":
        return { label: "HTTP Response", statusCode: 200 } as HttpResponseData;
      case "function":
        return {
          label: "Function",
          functionBody: "module.exports = function(msg) {\n  return msg;\n}",
        } as FunctionData;
      default:
        return { label: `${type} node` };
    }
  };

  const handleNodeDataChange = useCallback(
    (updatedData: Partial<HttpInData | HttpResponseData | FunctionData>) => {
      if (!selectedNode) return;

      console.log("Updating node:", selectedNode.id, "with data:", updatedData);

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
            <AddNodeButton />
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
