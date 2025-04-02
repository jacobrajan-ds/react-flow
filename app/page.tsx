import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import WorkflowCard from "@/components/WorkflowCard";
import WorkflowTable from "@/components/WorkflowTable";
import WorkflowForm from "@/components/WorkflowForm";
import {
  Search,
  Grid,
  List,
  FileText,
  Sliders,
  LayoutGrid,
  CirclePlus,
} from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  description: string;
  parent_id?: string;
  actions?: { app_name?: string; large_image?: string }[];
  triggers?: { id: string; name: string }[];
  schedules?: number;
}

export default function WorkflowPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("board");
  const [openModal, setOpenModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/collections");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      // Transform the data to match our Workflow interface
      const workflowList: Workflow[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        parent_id: item.parent_id,
        // Add empty arrays for these properties to avoid undefined errors
        actions: [],
        triggers: [],
        schedules: 0,
      }));

      setWorkflows(workflowList);
    } catch (error) {
      console.error("Error fetching workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value.toLowerCase();

    if (searchValue === "") {
      fetchWorkflows(); // Reset to all workflows
    } else {
      // Filter workflows by name or description
      const filtered = workflows.filter(
        (workflow) =>
          workflow.name.toLowerCase().includes(searchValue) ||
          workflow.description.toLowerCase().includes(searchValue)
      );
      setWorkflows(filtered);
    }
  };

  const handleCardClick = (workflowId: string) => {
    router.push(`/workflow/${workflowId}`);
  };

  const handleCreateSuccess = () => {
    fetchWorkflows();
    setOpenModal(false);
  };

  return (
    <div className="flex h-screen bg-[#131B2F] text-white">
      <Sidebar />

      <div className="flex-1 overflow-auto">
        <div className="max-w-screen-xl mx-auto p-9">
          <div>
            <h1 className="text-[24px] font-bold text-white">Workflows</h1>
          </div>

          <div className="py-2"></div>

          <div className="w-full py-4 flex justify-between items-center">
            {/* View toggles */}
            <div className="flex justify-between items-center bg-[#071026] border-[#00F6FF] border rounded-lg p-1.5 relative w-72 px-4">
              <div
                className={`absolute h-[85%] top-[7.5%] rounded-md bg-[#00F6FF] transition-all duration-300 ease-in-out ${
                  currentView === "board"
                    ? "left-[1%] w-[49%]"
                    : "left-[50%] w-[49%]"
                }`}
              />
              <button
                onClick={() => setCurrentView("board")}
                className={`z-10 flex items-center gap-2 py-1 rounded-md text-[16px] transition-colors duration-300 ${
                  currentView === "board"
                    ? "text-[#071026] font-medium"
                    : "text-gray-400"
                }`}
              >
                <Grid size={18} />
                <span>Board View</span>
              </button>
              <button
                onClick={() => setCurrentView("list")}
                className={`z-10 flex items-center gap-2 py-1 rounded-md text-[16px] transition-colors duration-300 ${
                  currentView === "list"
                    ? "text-[#071026] font-medium"
                    : "text-gray-400"
                }`}
              >
                <List size={18} />
                <span>List View</span>
              </button>
            </div>

            {/* Search and controls */}
            <div className="flex items-center gap-3">
              <span className="bg-gradient-to-r from-[#00F6FF] to-[#61DDFF] w-[1px] h-[40px] me-6"></span>

              <div className="relative">
                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search Workflows"
                  onChange={handleSearch}
                  className="bg-[#071026] pl-10 pr-4 py-2 rounded-md text-gray-300 placeholder-gray-300 focus:outline-none border border-[#00F6FF]"
                />
              </div>

              <div className="flex gap-2">
                <button className="p-2 rounded bg-[#071026] text-gray-300 hover:bg-gray-700">
                  <FileText size={20} />
                </button>
                <button className="p-2 rounded bg-[#071026] text-gray-300 hover:bg-gray-700">
                  <Sliders size={20} />
                </button>
                <button className="p-2 rounded bg-[#071026] text-gray-300 hover:bg-gray-700">
                  <LayoutGrid size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Workflow content */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-10">
              <div>{/* Tab navigation can be added here if needed */}</div>
              <button
                onClick={() => setOpenModal(true)}
                className="bg-[#071026] flex size-10 justify-center items-center rounded-full border-dashed border-[2px] border-[#00F6FF] hover:bg-[#0A162E] transition-colors"
              >
                <CirclePlus color="#00F6FF" />
              </button>
            </div>

            <WorkflowForm
              openModal={openModal}
              setOpenModal={setOpenModal}
              onSuccess={handleCreateSuccess}
            />

            {currentView === "board" ? (
              <div className="flex flex-wrap gap-4">
                {loading
                  ? Array(4)
                      .fill(null)
                      .map((_, index) => (
                        <WorkflowCard
                          key={`loading-${index}`}
                          isLoading={true}
                        />
                      ))
                  : workflows.map((workflow) => (
                      <div
                        key={workflow?.id}
                        onClick={() => handleCardClick(workflow.id)}
                      >
                        <WorkflowCard workflow={workflow} />
                      </div>
                    ))}
              </div>
            ) : (
              <div className="mt-2">
                <WorkflowTable
                  workflows={workflows}
                  isLoading={loading}
                  setOpenModal={setOpenModal}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
