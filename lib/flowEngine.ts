import { FlowContext, CustomNode, FlowMessage } from "@/app/types/flow";

export class FlowEngine {
  private context: FlowContext;
  private executionLog: string[] = [];

  constructor(context: FlowContext) {
    this.context = context;
  }

  public getExecutionLog(): string[] {
    return this.executionLog;
  }

  private log(message: string): void {
    this.executionLog.push(`[${new Date().toISOString()}] ${message}`);
    console.log(`Flow execution: ${message}`);
  }

  public async executeHttpFlow(nodeId: string, req: any): Promise<any> {
    this.executionLog = [];

    const startNode = this.context.nodes.find((node) => node.id === nodeId);
    if (!startNode) {
      const error = new Error(`Start node with ID ${nodeId} not found`);
      this.log(error.message);
      throw error;
    }

    if (startNode.type !== "httpIn") {
      const error = new Error(`Node ${nodeId} is not an HTTP In node`);
      this.log(error.message);
      throw error;
    }

    this.log(
      `Starting flow execution from node: ${
        startNode.data.label || startNode.id
      } (${startNode.type})`
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
    } catch (error: any) {
      this.log(`Flow execution failed: ${error.message}`);
      error.logs = this.executionLog;
      throw error;
    }
  }

  private async processNode(node: CustomNode, msg: FlowMessage): Promise<any> {
    this.log(`Processing node: ${node.data.label || node.id} (${node.type})`);

    const processedMsg = await this.executeNode(node, { ...msg });
    this.log(`Node output: ${JSON.stringify(processedMsg.payload)}`);

    const outgoingEdges = this.context.edges.filter(
      (edge) => edge.source === node.id
    );

    if (node.type === "httpResponse") {
      this.log(
        `HTTP Response node reached with status: ${node.data.statusCode || 200}`
      );
      return processedMsg.payload;
    }

    if (outgoingEdges.length > 0) {
      this.log(`Found ${outgoingEdges.length} outgoing connections`);

      this.log(`All edges: ${JSON.stringify(this.context.edges)}`);
      this.log(
        `All nodes: ${JSON.stringify(
          this.context.nodes.map((n) => ({ id: n.id, type: n.type }))
        )}`
      );

      for (const edge of outgoingEdges) {
        this.log(`Checking edge from ${edge.source} to ${edge.target}`);
        const nextNode = this.context.nodes.find((n) => n.id === edge.target);

        if (nextNode) {
          this.log(`Found next node: ${nextNode.id} (${nextNode.type})`);
          return this.processNode(nextNode, processedMsg);
        } else {
          this.log(`Warning: Could not find node with ID: ${edge.target}`);
        }
      }

      this.log(`No valid target nodes found for ${node.id}`);
    } else {
      this.log(`Node has no outgoing connections`);
    }

    return processedMsg.payload;
  }

  private async executeNode(
    node: CustomNode,
    msg: FlowMessage
  ): Promise<FlowMessage> {
    switch (node.type) {
      case "httpIn":
        this.log(`HTTP In node (${node.data.method} ${node.data.url})`);
        return msg;

      case "httpResponse":
        this.log(`HTTP Response node (Status: ${node.data.statusCode || 200})`);
        msg.res = {
          statusCode: parseInt(node.data.statusCode) || 200,
          contentType: node.data.contentType || "application/json",
        };
        return msg;

      case "function":
        this.log(`Executing function node`);
        this.log(`Function body: ${node.data.functionBody}`);

        try {
          const functionBody =
            node.data.functionBody ||
            "module.exports = function(msg) { return msg; }";

          const fn = new Function(
            "msg",
            `
            try {
              const module = { exports: null };
              ${functionBody}
              if (typeof module.exports !== 'function') {
                throw new Error('Function node must export a function');
              }
              const result = module.exports(msg);
              return result;
            } catch (error) {
              console.error('Function execution error:', error);
              throw error;
            }
            `
          );

          const result = await fn(msg);
          this.log(
            `Function executed successfully, result: ${JSON.stringify(result)}`
          );

          if (result === undefined || result === null) {
            return msg;
          } else if (
            typeof result === "object" &&
            result.payload !== undefined
          ) {
            return result;
          } else {
            msg.payload = result;
            return msg;
          }
        } catch (error: any) {
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
