// app/lib/flowEngine.ts
import { FlowContext } from "@/app/types/flow";
import {
  CustomNode,
  CustomEdge,
  HttpInData,
  HttpResponseData,
  FunctionData,
  FlowMessage,
} from "@/app/types/flow";

export class FlowEngine {
  private context: FlowContext;
  private executionLog: string[] = [];

  constructor(context: FlowContext) {
    this.context = context;
  }

  // Get execution logs
  public getExecutionLog(): string[] {
    return this.executionLog;
  }

  // Log execution steps
  private log(message: string): void {
    this.executionLog.push(`[${new Date().toISOString()}] ${message}`);
    console.log(`Flow execution: ${message}`);
  }

  // Start execution from an HTTP node
  public async executeHttpFlow(nodeId: string, req: any): Promise<any> {
    this.executionLog = []; // Reset logs

    const startNode = this.context.nodes.find((node) => node.id === nodeId);
    if (!startNode || startNode.type !== "httpIn") {
      throw new Error("Invalid start node");
    }

    this.log(
      `Starting flow execution from node: ${
        startNode.data.label || startNode.id
      }`
    );

    const msg: FlowMessage = {
      payload: req.body || {},
      req: req,
      res: null,
      _msgid: Date.now().toString(),
    };

    try {
      const result = await this.processNode(startNode, msg);
      this.log("Flow execution completed successfully");
      return {
        result: result,
        logs: this.executionLog,
      };
    } catch (error) {
      this.log(`Flow execution failed: ${error.message}`);
      throw error;
    }
  }

  // Process a node and follow the flow
  private async processNode(node: CustomNode, msg: FlowMessage): Promise<any> {
    this.log(`Processing node: ${node.data.label || node.id} (${node.type})`);

    // Process the current node
    const processedMsg = await this.executeNode(node, msg);

    // Find connected nodes
    const outgoingEdges = this.context.edges.filter(
      (edge) => edge.source === node.id
    );

    // If this is a response node, return the result
    if (node.type === "httpResponse") {
      this.log(
        `HTTP Response node reached with status: ${
          (node.data as HttpResponseData).statusCode
        }`
      );
      return processedMsg.payload;
    }

    // Process the next nodes in the flow
    if (outgoingEdges.length > 0) {
      this.log(`Found ${outgoingEdges.length} outgoing connections`);

      // For simplicity, we're just following the first edge
      const nextNodeId = outgoingEdges[0].target;
      const nextNode = this.context.nodes.find((n) => n.id === nextNodeId);

      if (nextNode) {
        return this.processNode(nextNode, processedMsg);
      } else {
        this.log(`Warning: Could not find next node with ID: ${nextNodeId}`);
      }
    } else {
      this.log(`Node has no outgoing connections`);
    }

    return processedMsg.payload;
  }

  // Execute a single node
  private async executeNode(
    node: CustomNode,
    msg: FlowMessage
  ): Promise<FlowMessage> {
    switch (node.type) {
      case "httpIn":
        const httpData = node.data as HttpInData;
        this.log(`HTTP In node (${httpData.method} ${httpData.url})`);
        return msg;

      case "httpResponse":
        const responseData = node.data as HttpResponseData;
        this.log(`HTTP Response node (Status: ${responseData.statusCode})`);
        msg.res = {
          statusCode: responseData.statusCode,
          contentType: responseData.contentType || "application/json",
        };
        return msg;

      case "function":
        const functionData = node.data as FunctionData;
        this.log(`Executing function node`);

        try {
          // Create a function from the function body
          const fn = new Function(
            "msg",
            `
            const module = {};
            ${functionData.functionBody}
            return module.exports(msg);
          `
          );

          // Execute the function
          const result = await fn(msg);
          this.log(`Function executed successfully`);
          return result || msg;
        } catch (error) {
          this.log(`Error executing function: ${error.message}`);
          msg.error = error;
          return msg;
        }

      default:
        this.log(`Unknown node type: ${node.type}`);
        return msg;
    }
  }
}
