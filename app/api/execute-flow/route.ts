import { NextRequest, NextResponse } from "next/server";
import { savedFlows } from "../workflows/route";
import { FlowEngine } from "@/lib/flowEngine";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const flowId = searchParams.get("flowId");
    const nodeId = searchParams.get("nodeId");

    if (!flowId || !nodeId) {
      return NextResponse.json(
        { error: "Missing flowId or nodeId" },
        { status: 400 }
      );
    }

    console.log(`Executing flow ${flowId} starting from node ${nodeId}`);

    const flow = savedFlows[flowId];
    if (!flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    const startNode = flow.nodes.find((node) => node.id === nodeId);
    if (!startNode) {
      return NextResponse.json(
        {
          error: "Start node not found",
          message: `Node with ID ${nodeId} not found in flow`,
        },
        { status: 400 }
      );
    }

    if (startNode.type !== "httpIn") {
      return NextResponse.json(
        {
          error: "Invalid start node",
          message: `Node with ID ${nodeId} is not an HTTP In node`,
        },
        { status: 400 }
      );
    }

    const engine = new FlowEngine({ nodes: flow.nodes, edges: flow.edges });

    const body = await request.json();
    const result = await engine.executeHttpFlow(nodeId, {
      body,
      headers: Object.fromEntries(request.headers),
      method: request.method,
      query: Object.fromEntries(searchParams.entries()),
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error executing flow:", error);
    return NextResponse.json(
      {
        error: "Error executing flow",
        message: error instanceof Error ? error.message : "Unknown error",
        logs: error.logs || [],
      },
      { status: 500 }
    );
  }
}
