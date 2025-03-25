import { NextRequest, NextResponse } from "next/server";
import { CustomNode, CustomEdge } from "@/app/types/flow";

export let savedFlows: {
  [key: string]: { nodes: CustomNode[]; edges: CustomEdge[] };
} = {};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flowId, nodes, edges } = body;

    if (!flowId || !nodes || !edges) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    savedFlows[flowId] = { nodes, edges };

    return NextResponse.json({
      success: true,
      message: "Flow saved successfully",
    });
  } catch (error) {
    console.error("Error saving flow:", error);
    return NextResponse.json(
      {
        error: "Error saving flow",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
