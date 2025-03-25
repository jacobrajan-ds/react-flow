import React, { FC } from "react";

interface DebugPanelProps {
  logs: string[];
  result?: any;
  isVisible: boolean;
  onClose: () => void;
}

const DebugPanel: FC<DebugPanelProps> = ({
  logs,
  result,
  isVisible,
  onClose,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white h-64 overflow-auto z-50">
      <div className="flex justify-between items-center p-2 bg-gray-800">
        <h3 className="font-bold">Debug Panel</h3>
        <button className="text-white hover:text-gray-300" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="flex h-[calc(100%-40px)]">
        <div className="w-1/2 p-2 border-r border-gray-700">
          <h4 className="font-bold mb-2">Execution Logs</h4>
          <div className="font-mono text-sm overflow-auto h-[calc(100%-2rem)]">
            {logs.length === 0 ? (
              <div className="text-gray-400">No logs available</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="py-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-1/2 p-2">
          <h4 className="font-bold mb-2">Execution Result</h4>
          <div className="font-mono text-sm overflow-auto h-[calc(100%-2rem)]">
            {result ? (
              <pre>{JSON.stringify(result, null, 2)}</pre>
            ) : (
              <div className="text-gray-400">No result available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
