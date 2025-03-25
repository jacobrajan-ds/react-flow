// app/components/NodeConfiguration.tsx
import React, { FC } from "react";
import {
  CustomNode,
  HttpInData,
  HttpResponseData,
  FunctionData,
} from "@/app/types/flow";
import HttpInConfiguration from "./HttpInConfiguration";
import HttpResponseConfiguration from "./HttpResponseConfiguration";
import FunctionConfiguration from "./FunctionConfiguration";

interface NodeConfigurationProps {
  node: CustomNode;
  onChange: (
    updatedData: Partial<HttpInData | HttpResponseData | FunctionData>
  ) => void;
}

const NodeConfiguration: FC<NodeConfigurationProps> = ({ node, onChange }) => {
  switch (node.type) {
    case "httpIn":
      return <HttpInConfiguration node={node} onChange={onChange} />;
    case "httpResponse":
      return <HttpResponseConfiguration node={node} onChange={onChange} />;
    case "function":
      return <FunctionConfiguration node={node} onChange={onChange} />;
    default:
      return <div>No configuration available for this node type</div>;
  }
};

export default NodeConfiguration;
