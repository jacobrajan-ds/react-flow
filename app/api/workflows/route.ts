import { NextRequest, NextResponse } from "next/server";
import { CustomNode, CustomEdge } from "@/app/types/flow";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const WORKFLOWS_FILE = path.join(DATA_DIR, "workflows.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(WORKFLOWS_FILE)) {
  fs.writeFileSync(WORKFLOWS_FILE, JSON.stringify({}), "utf8");
}

function loadWorkflows() {
  try {
    const data = fs.readFileSync(WORKFLOWS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading workflows:", error);
    return {};
  }
}

function saveWorkflows(workflows: any) {
  try {
    fs.writeFileSync(
      WORKFLOWS_FILE,
      JSON.stringify(workflows, null, 2),
      "utf8"
    );
  } catch (error) {
    console.error("Error saving workflows:", error);
  }
}

export let savedFlows = loadWorkflows();

export async function GET() {
  const workflowIds = Object.keys(savedFlows);
  return NextResponse.json(workflowIds);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nodes, edges, title, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing workflow ID" },
        { status: 400 }
      );
    }

    savedFlows[id] = {
      nodes: nodes || [],
      edges: edges || [],
      title: title || `Workflow ${id.substring(0, 8)}`,
      description: description || "",
    };
    saveWorkflows(savedFlows);

    console.log(
      `Saved workflow ${id}, total workflows: ${Object.keys(savedFlows).length}`
    );

    return NextResponse.json({
      success: true,
      message: "Workflow saved successfully",
      id,
    });
  } catch (error) {
    console.error("Error saving workflow:", error);
    return NextResponse.json(
      {
        error: "Error saving workflow",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
