import { NextRequest, NextResponse } from "next/server";
import { savedFlows } from "../route";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const pathname = request.nextUrl.pathname;
  const id = pathname.split("/").pop();

  console.log(
    `Fetching workflow ${id}, available workflows: ${Object.keys(
      savedFlows
    ).join(", ")}`
  );

  if (!id) {
    return NextResponse.json({ error: "Missing workflow ID" }, { status: 400 });
  }

  const workflow = savedFlows[id];

  if (!workflow) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  return NextResponse.json(workflow);
}
