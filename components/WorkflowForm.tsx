"use client";

import { useState } from "react";
import { X } from "lucide-react";
import axiosInstance from "@/utils/axios";

interface WorkflowFormProps {
  openModal: boolean;
  setOpenModal: (open: boolean) => void;
  onSuccess: () => void;
}

interface NewWorkflow {
  name: string;
  description: string;
  parent_id: string | null;
}

export default function WorkflowForm({
  openModal,
  setOpenModal,
  onSuccess,
}: WorkflowFormProps) {
  const [newWorkflow, setNewWorkflow] = useState<NewWorkflow>({
    name: "",
    description: "",
    parent_id: null,
  });
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateWorkflow = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await axiosInstance.post("/api/collection", newWorkflow);

      if (!response.ok) {
        const errorData = response.data;
        throw new Error(errorData.message || "Failed to create workflow");
      }

      const data = response.data;
      setNewWorkflow({ name: "", description: "", parent_id: null });
      onSuccess();
    } catch (err: any) {
      console.error("Error creating workflow:", err);
      setError(err.message || "An error occurred while creating the workflow");
    } finally {
      setIsCreating(false);
    }
  };

  if (!openModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#0A162E] rounded-lg w-full max-w-md">
        <div className="bg-[#071026] flex justify-between items-center rounded-t-lg">
          <h1 className="text-lg font-normal p-4 px-8 text-white">
            Create New Workflow
          </h1>
          <button
            className="p-4 text-gray-400 hover:text-white"
            onClick={() => setOpenModal(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-md text-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateWorkflow}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-white mb-1"
              >
                Workflow Name*
              </label>
              <input
                type="text"
                id="name"
                value={newWorkflow.name}
                onChange={(e) =>
                  setNewWorkflow((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full px-3 bg-[#071026] py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00F6FF] text-white"
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-white mb-1"
              >
                Description*
              </label>
              <textarea
                id="description"
                value={newWorkflow.description}
                onChange={(e) =>
                  setNewWorkflow((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="w-full bg-[#071026] px-3 py-2 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00F6FF] text-white"
                rows={3}
                required
              />
            </div>
            <div className="flex justify-end gap-2 mt-8">
              <button
                type="button"
                className="px-4 py-2 text-gray-300 hover:text-white"
                onClick={() => setOpenModal(false)}
                disabled={isCreating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-[#00F6FF] text-[#071026] px-4 py-2 rounded-lg hover:bg-[#61DDFF] transition-colors font-medium"
                disabled={isCreating}
              >
                {isCreating ? "Creating..." : "Create Workflow"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
