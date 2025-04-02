import React, { useState, useEffect } from "react";
import { FiMenu, FiPlus, FiFolder } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GoWorkflow } from "react-icons/go";

interface Workflow {
  id: string;
  title: string;
  description?: string;
}

const Sidebar = ({
  isOpen,
  toggle,
}: {
  isOpen: boolean;
  toggle: () => void;
}) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newWorkflowTitle, setNewWorkflowTitle] = useState("");
  const [newWorkflowDescription, setNewWorkflowDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/workflows");
      if (response.ok) {
        const workflowIds = await response.json();

        // Fetch details for each workflow
        const workflowDetails = await Promise.all(
          workflowIds.map(async (id: string) => {
            const detailResponse = await fetch(`/api/workflows/${id}`);
            if (detailResponse.ok) {
              const data = await detailResponse.json();
              return {
                id,
                title: data.title || `Workflow ${id.substring(0, 8)}`,
                description: data.description || "",
              };
            }
            return { id, title: `Workflow ${id.substring(0, 8)}` };
          })
        );

        setWorkflows(workflowDetails);
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewWorkflow = async () => {
    if (!newWorkflowTitle.trim()) return;

    const newFlowId = `flow-${Date.now()}`;
    try {
      const response = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: newFlowId,
          nodes: [],
          edges: [],
          title: newWorkflowTitle,
          description: newWorkflowDescription,
        }),
      });

      if (response.ok) {
        setIsCreateModalOpen(false);
        setNewWorkflowTitle("");
        setNewWorkflowDescription("");
        await fetchWorkflows();
        router.push(`?id=${newFlowId}`);
      }
    } catch (error) {
      console.error("Error creating workflow:", error);
    }
  };

  return (
    <>
      <div
        className={`fixed top-0 left-0 h-full bg-[#071026] text-white transition-all duration-300 z-10 ${
          isOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          {isOpen && <h2 className="font-bold">Workflows</h2>}
          <button onClick={toggle} className="p-2 rounded hover:bg-gray-700">
            <FiMenu />
          </button>
        </div>

        <div className="p-4">
          <button
            className="flex items-center gap-2 w-full p-2 rounded bg-gray-600 mb-4"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <FiPlus />
            {isOpen && <span>Create Workflow</span>}
          </button>

          {isLoading ? (
            <div className="text-center py-4 text-gray-400">Loading...</div>
          ) : workflows.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              No workflows found
            </div>
          ) : (
            <div className="space-y-2">
              {workflows.map((workflow) => (
                <Link
                  href={`?id=${workflow.id}`}
                  key={workflow.id}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 truncate"
                >
                  <GoWorkflow />
                  {isOpen && (
                    <div className="truncate">
                      <div className="font-medium">{workflow.title}</div>
                      {workflow.description && (
                        <div className="text-xs text-gray-400 truncate">
                          {workflow.description}
                        </div>
                      )}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Workflow Modal */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 bg-black flex items-center justify-center z-50 "
          style={{ opacity: "0.8" }}
        >
          <div className="bg-[#071026] rounded-lg p-6 w-96 text-white">
            <h3 className="text-xl font-bold mb-4">Create New Workflow</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-[#0c3a4c] border border-gray-600 rounded-md focus:outline-none"
                  value={newWorkflowTitle}
                  onChange={(e) => setNewWorkflowTitle(e.target.value)}
                  placeholder="My Workflow"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Description (optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 bg-[#0c3a4c] border border-gray-600 rounded-md focus:outline-none"
                  value={newWorkflowDescription}
                  onChange={(e) => setNewWorkflowDescription(e.target.value)}
                  placeholder="Workflow description..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-gray-600 rounded"
                  onClick={createNewWorkflow}
                  disabled={!newWorkflowTitle.trim()}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
