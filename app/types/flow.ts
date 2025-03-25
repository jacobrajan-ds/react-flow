import { Node, Edge } from "@xyflow/react";

export type NodeData = {
  label: string;
  [key: string]: any;
};

export type HttpInData = NodeData & {
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
};

export type HttpResponseData = NodeData & {
  statusCode: number;
  contentType?: string;
};

export type FunctionData = NodeData & {
  functionBody: string;
};

export type CustomNode = Node<NodeData>;
export type CustomEdge = Edge;

export interface FlowContext {
  nodes: CustomNode[];
  edges: CustomEdge[];
}

export interface FlowMessage {
  payload: any;
  [key: string]: any;
}

export interface NodeTypeDefinition {
  id: string;
  label: string;
  category: string;
  description: string;
  icon?: string;
}

export interface NodeConfigField {
  id: string;
  label: string;
  type: string;
  defaultValue?: any;
  options?: { value: string; label: string }[];
  required?: boolean;
}

export interface NodeConfigSchema {
  defaultLabel: string;
  fields: NodeConfigField[];
}
