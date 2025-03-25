import { NextRequest, NextResponse } from "next/server";
import { CustomNode, CustomEdge } from "@/app/types/flow";
import { savedFlows } from "../save-flow/route";
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

    const flow = savedFlows[flowId];
    if (!flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
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
  } catch (error) {
    console.error("Error executing flow:", error);
    return NextResponse.json(
      {
        error: "Error executing flow",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
