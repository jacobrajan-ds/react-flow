import { Node, Edge } from "@xyflow/react";

export type NodeData = {
  label: string;
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

export type CustomNode = Node<
  NodeData | HttpInData | HttpResponseData | FunctionData
>;
export type CustomEdge = Edge;

export interface FlowContext {
  nodes: CustomNode[];
  edges: CustomEdge[];
}

export interface FlowMessage {
  payload: any;
  [key: string]: any;
}
