import { NextResponse } from "next/server";
import { NodeTypeDefinition } from "@/app/types/flow";

const nodeTypes: NodeTypeDefinition[] = [
  {
    id: "httpIn",
    label: "HTTP In",
    category: "Network",
    description: "HTTP endpoint to receive requests",
    icon: "IN",
  },
  {
    id: "httpResponse",
    label: "HTTP Response",
    category: "Network",
    description: "Send HTTP response",
    icon: "OUT",
  },
  {
    id: "function",
    label: "Function",
    category: "Processing",
    description: "JavaScript function to process data",
    icon: "FN",
  },
  {
    id: "debug",
    label: "Debug",
    category: "Utility",
    description: "Log messages for debugging",
    icon: "DB",
  },
  {
    id: "switch",
    label: "Switch",
    category: "Flow Control",
    description: "Route messages based on conditions",
    icon: "SW",
  },
  {
    id: "delay",
    label: "Delay",
    category: "Utility",
    description: "Delay message processing",
    icon: "DL",
  },
  {
    id: "template",
    label: "Template",
    category: "Processing",
    description: "Create message using a template",
    icon: "TM",
  },
];

export async function GET() {
  return NextResponse.json(nodeTypes);
}
