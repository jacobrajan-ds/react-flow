import { NextRequest, NextResponse } from "next/server";
import { NodeConfigSchema } from "@/app/types/flow";

const nodeConfigs: Record<string, NodeConfigSchema> = {
  httpIn: {
    defaultLabel: "HTTP In",
    action: [
      {
        id: "action",
        label: "Action",
        type: "select",
        fields: [
          {
            id: "label",
            label: "Name",
            type: "text",
            defaultValue: "HTTP In",
            required: true,
          },
          {
            id: "method",
            label: "Method",
            type: "select",
            defaultValue: "GET",
            options: [
              { value: "GET", label: "GET" },
              { value: "POST", label: "POST" },
              { value: "PUT", label: "PUT" },
              { value: "DELETE", label: "DELETE" },
            ],
            required: true,
          },
          {
            id: "url",
            label: "URL",
            type: "text",
            defaultValue: "/api",
            required: true,
          },
        ],
      },
    ],
  },
  httpResponse: {
    defaultLabel: "HTTP Response",
    fields: [
      {
        id: "label",
        label: "Name",
        type: "text",
        defaultValue: "HTTP Response",
        required: true,
      },
      {
        id: "statusCode",
        label: "Status Code",
        type: "select",
        defaultValue: "200",
        options: [
          { value: "200", label: "200 - OK" },
          { value: "201", label: "201 - Created" },
          { value: "400", label: "400 - Bad Request" },
          { value: "401", label: "401 - Unauthorized" },
          { value: "404", label: "404 - Not Found" },
          { value: "500", label: "500 - Server Error" },
        ],
        required: true,
      },
      {
        id: "contentType",
        label: "Content Type",
        type: "select",
        defaultValue: "application/json",
        options: [
          { value: "application/json", label: "application/json" },
          { value: "text/plain", label: "text/plain" },
          { value: "text/html", label: "text/html" },
        ],
      },
    ],
  },
  function: {
    defaultLabel: "Function",
    fields: [
      {
        id: "label",
        label: "Name",
        type: "text",
        defaultValue: "Function",
        required: true,
      },
      {
        id: "functionBody",
        label: "Function",
        type: "code",
        defaultValue: `module.exports = function(msg) {
  // Your code here
  return msg;
}`,
        required: true,
      },
    ],
  },
  debug: {
    defaultLabel: "Debug",
    fields: [
      {
        id: "label",
        label: "Name",
        type: "text",
        defaultValue: "Debug",
        required: true,
      },
      {
        id: "active",
        label: "Active",
        type: "checkbox",
        defaultValue: true,
      },
      {
        id: "console",
        label: "Output to console",
        type: "checkbox",
        defaultValue: true,
      },
    ],
  },
  switch: {
    defaultLabel: "Switch",
    fields: [
      {
        id: "label",
        label: "Name",
        type: "text",
        defaultValue: "Switch",
        required: true,
      },
      {
        id: "property",
        label: "Property",
        type: "text",
        defaultValue: "payload",
      },
      {
        id: "rules",
        label: "Rules",
        type: "code",
        defaultValue: `[
  { "value": "value1", "output": 1 },
  { "value": "value2", "output": 2 }
]`,
      },
    ],
  },
  delay: {
    defaultLabel: "Delay",
    fields: [
      {
        id: "label",
        label: "Name",
        type: "text",
        defaultValue: "Delay",
        required: true,
      },
      {
        id: "delayTime",
        label: "Delay (ms)",
        type: "number",
        defaultValue: 1000,
      },
    ],
  },
  template: {
    defaultLabel: "Template",
    fields: [
      {
        id: "label",
        label: "Name",
        type: "text",
        defaultValue: "Template",
        required: true,
      },
      {
        id: "template",
        label: "Template",
        type: "code",
        defaultValue: `{
  "message": "Hello {{payload.name}}",
  "timestamp": "{{$timestamp}}"
}`,
      },
      {
        id: "outputProperty",
        label: "Output Property",
        type: "text",
        defaultValue: "payload",
      },
    ],
  },
};

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string } }
) {
  const nodeType = params.type;

  if (!nodeType || !nodeConfigs[nodeType]) {
    return NextResponse.json({ error: "Node type not found" }, { status: 404 });
  }

  return NextResponse.json(nodeConfigs[nodeType]);
}
