"use client";
import React, { useState, useEffect } from "react";
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
  ChevronRight,
  Home,
} from "lucide-react";
import axiosInstance from "@/utils/axios";

// Types and interfaces remain the same as in your original code...
interface PlaybookVersion {
  id: string;
  version_number: number;
  execution_mode: string;
  module_code: string;
  webhook_id: string;
  is_latest: boolean;
  is_active: boolean;
  playbook_id: string;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  deleted_at: string;
  deleted_by: string;
  playbook_node_version: any[];
  execution: any[];
  edge: any[];
}

interface Playbook {
  id: string;
  name: string;
  description: string;
  collection_id: string;
  owner_id: string;
  playbook_version: PlaybookVersion[];
}

interface Collection {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  playbook: Playbook[];
  collection: Collection[];
}

interface BreadcrumbItem {
  id: string;
  name: string;
  type: "collection" | "playbook";
}

interface DisplayItem {
  id: string;
  name: string;
  description: string;
  type: "collection" | "playbook" | "playbookVersion";
  parent_id?: string | null;
  playbook_version?: PlaybookVersion[];
  version_info?: PlaybookVersion;
}

export default function WorkflowPage() {
  const [allWorkflows, setAllWorkflows] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState("board");
  const [openModal, setOpenModal] = useState(false);
  const router = useRouter();

  // Separate state for Card View
  const [cardItems, setCardItems] = useState<DisplayItem[]>([]);
  const [currentCollection, setCurrentCollection] = useState<string | null>(
    null
  );
  const [currentPlaybook, setCurrentPlaybook] = useState<string | null>(null);
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);

  // Separate state for Table View
  const [tableItems, setTableItems] = useState<DisplayItem[]>([]);
  const [tableRefreshTrigger, setTableRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/collection");

      const workflowList: Collection[] = await response.data?.map(
        (item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          parent_id: item.parent_id,
          actions: [],
          triggers: [],
          schedules: 0,
          playbook: item.playbook || [],
          collection: item.collection || [],
        })
      );

      setAllWorkflows(workflowList);

      // Get root-level collections
      const rootCollections = workflowList.filter((w) => w.parent_id === null);

      // Set initial state for both card and table views
      const rootDisplayItems: DisplayItem[] = rootCollections.map(
        (collection) => ({
          id: collection.id,
          name: collection.name,
          description: collection.description,
          type: "collection",
          parent_id: collection.parent_id,
        })
      );

      setCardItems(rootDisplayItems);
      setTableItems(rootDisplayItems);
    } catch (error) {
      console.error("Error fetching workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value.toLowerCase();

    if (searchValue === "") {
      // Reset to current level for card view
      if (currentPlaybook) {
        navigateToPlaybook(currentPlaybook);
      } else if (currentCollection) {
        navigateToCollection(currentCollection);
      } else {
        // Reset to root collections
        const rootCollections = allWorkflows.filter(
          (w) => w.parent_id === null
        );

        const rootDisplayItems: DisplayItem[] = rootCollections.map(
          (collection) => ({
            id: collection.id,
            name: collection.name,
            description: collection.description,
            type: "collection",
            parent_id: collection.parent_id,
          })
        );

        setCardItems(rootDisplayItems);
      }

      // Reset table view to show root collections for simplicity
      // You could maintain separate navigation state for table if needed
      const rootTableItems = allWorkflows
        .filter((w) => w.parent_id === null)
        .map((collection) => ({
          id: collection.id,
          name: collection.name,
          description: collection.description,
          type: "collection",
          parent_id: collection.parent_id,
        }));

      setTableItems(rootTableItems);
    } else {
      // Search in all workflows, playbooks, and versions
      const searchResults: DisplayItem[] = [];

      // Search function for traversing the hierarchy
      const searchInHierarchy = (collection: Collection) => {
        // Check if collection matches
        if (
          collection.name.toLowerCase().includes(searchValue) ||
          collection.description.toLowerCase().includes(searchValue)
        ) {
          searchResults.push({
            id: collection.id,
            name: collection.name,
            description: collection.description,
            type: "collection",
            parent_id: collection.parent_id,
          });
        }

        // Search in playbooks
        if (collection.playbook) {
          collection.playbook.forEach((playbook) => {
            if (
              playbook.name.toLowerCase().includes(searchValue) ||
              playbook.description.toLowerCase().includes(searchValue)
            ) {
              searchResults.push({
                id: playbook.id,
                name: playbook.name,
                description: playbook.description,
                type: "playbook",
                parent_id: collection.id,
                playbook_version: playbook.playbook_version,
              });
            }

            // Search in playbook versions
            if (playbook.playbook_version) {
              playbook.playbook_version.forEach((version) => {
                if (
                  version.execution_mode.toLowerCase().includes(searchValue) ||
                  version.id.toLowerCase().includes(searchValue)
                ) {
                  searchResults.push({
                    id: version.id,
                    name: `${playbook.name} (Version ${version.version_number})`,
                    description: `Execution mode: ${version.execution_mode}`,
                    type: "playbookVersion",
                    parent_id: playbook.id,
                    version_info: version,
                  });
                }
              });
            }
          });
        }

        // Search in nested collections
        if (collection.collection) {
          collection.collection.forEach(searchInHierarchy);
        }
      };

      // Start search from root collections
      allWorkflows.forEach(searchInHierarchy);

      // Update both views with search results
      setCardItems(searchResults);
      setTableItems(searchResults);
    }
  };

  // Card-specific navigation functions
  const navigateToPlaybook = (playbookId: string) => {
    // Find the playbook
    let foundPlaybook: Playbook | undefined;
    let parentCollection: Collection | undefined;

    const findPlaybookAndParent = (collections: Collection[]) => {
      for (const collection of collections) {
        if (collection.playbook) {
          const playbook = collection.playbook.find((p) => p.id === playbookId);
          if (playbook) {
            foundPlaybook = playbook;
            parentCollection = collection;
            return true;
          }
        }

        if (collection.collection && collection.collection.length > 0) {
          const found = findPlaybookAndParent(collection.collection);
          if (found) return true;
        }
      }

      return false;
    };

    findPlaybookAndParent(allWorkflows);

    if (!foundPlaybook || !parentCollection) return;

    // Set current navigation state
    setCurrentPlaybook(playbookId);
    setCurrentCollection(parentCollection.id);

    // Update breadcrumb
    const breadcrumbPath: BreadcrumbItem[] = [];

    // Add the playbook to breadcrumb
    breadcrumbPath.push({
      id: foundPlaybook.id,
      name: foundPlaybook.name,
      type: "playbook",
    });

    // Add parent collection to breadcrumb path
    let currentItem: Collection | undefined = parentCollection;
    while (currentItem) {
      breadcrumbPath.unshift({
        id: currentItem.id,
        name: currentItem.name,
        type: "collection",
      });
      if (!currentItem.parent_id) break;
      currentItem = findCollectionById(allWorkflows, currentItem.parent_id);
    }

    setBreadcrumbItems(breadcrumbPath);

    // Show playbook versions as display items
    const versions: DisplayItem[] = foundPlaybook.playbook_version.map(
      (version) => ({
        id: version.id,
        name: `Version ${version.version_number}`,
        description: `Execution mode: ${version.execution_mode}`,
        type: "playbookVersion",
        parent_id: foundPlaybook?.id,
        version_info: version,
      })
    );

    setCardItems(versions);
  };

  const navigateToCollection = (collectionId: string | null) => {
    // Reset playbook navigation
    setCurrentPlaybook(null);

    if (collectionId === null) {
      // Navigate to root
      const rootCollections = allWorkflows.filter((w) => w.parent_id === null);

      const rootDisplayItems: DisplayItem[] = rootCollections.map(
        (collection) => ({
          id: collection.id,
          name: collection.name,
          description: collection.description,
          type: "collection",
          parent_id: collection.parent_id,
        })
      );

      setCardItems(rootDisplayItems);
      setCurrentCollection(null);
      setBreadcrumbItems([]);
      return;
    }

    // Find the collection
    const collection = findCollectionById(allWorkflows, collectionId);
    if (!collection) return;

    // Set current collection
    setCurrentCollection(collectionId);

    // Update breadcrumb
    const breadcrumbPath: BreadcrumbItem[] = [];
    let currentItem: Collection | undefined = collection;

    // Build the breadcrumb path
    while (currentItem) {
      breadcrumbPath.unshift({
        id: currentItem.id,
        name: currentItem.name,
        type: "collection",
      });
      if (!currentItem.parent_id) break;
      currentItem = findCollectionById(allWorkflows, currentItem.parent_id);
    }

    setBreadcrumbItems(breadcrumbPath);

    // Create a display list with child collections and playbooks
    const displayItems: DisplayItem[] = [];

    // Add child collections
    if (collection.collection && collection.collection.length > 0) {
      collection.collection.forEach((childCollection) => {
        displayItems.push({
          id: childCollection.id,
          name: childCollection.name,
          description: childCollection.description,
          type: "collection",
          parent_id: collectionId,
        });
      });
    }

    // Add playbooks
    if (collection.playbook && collection.playbook.length > 0) {
      collection.playbook.forEach((playbook) => {
        displayItems.push({
          id: playbook.id,
          name: playbook.name,
          description: playbook.description,
          type: "playbook",
          parent_id: collectionId,
          playbook_version: playbook.playbook_version,
        });
      });
    }

    setCardItems(displayItems);
  };

  const handleOpenDialog = (
    type: "collection" | "playbook" | "playbookVersion",
    parentId: string
  ) => {
    console.log(`Open dialog for ${type} under parent ID: ${parentId}`);
    // Implement dialog opening logic here
  };

  const handleItemClick = (item: any) => {
    console.log("View playbook:", item);
    // Implement navigation or other logic here
  };

  // Utility functions for finding collections and playbooks
  const findCollectionById = (
    collections: Collection[],
    id: string
  ): Collection | undefined => {
    for (const collection of collections) {
      if (collection.id === id) {
        return collection;
      }

      if (collection.collection && collection.collection.length > 0) {
        const found = findCollectionById(collection.collection, id);
        if (found) return found;
      }
    }
    return undefined;
  };

  const handleBreadcrumbNavigation = (
    item: BreadcrumbItem | null,
    index: number
  ) => {
    if (item === null) {
      // Navigate to root
      navigateToCollection(null);
    } else if (item.type === "collection") {
      // Navigate to specific collection
      navigateToCollection(item.id);

      // Truncate breadcrumb to this level
      setBreadcrumbItems(breadcrumbItems.slice(0, index + 1));
    } else if (item.type === "playbook") {
      // Navigate to specific playbook
      navigateToPlaybook(item.id);

      // Truncate breadcrumb to this level
      setBreadcrumbItems(breadcrumbItems.slice(0, index + 1));
    }
  };

  const handleCardClick = (item: DisplayItem) => {
    if (item.type === "collection") {
      // Navigate to collection
      navigateToCollection(item.id);
    } else if (item.type === "playbook") {
      // Navigate to playbook to show its versions
      navigateToPlaybook(item.id);
    } else if (item.type === "playbookVersion") {
      // Navigate to playbook version - redirect to a different page
      router.push(`/playbook/${item.parent_id}`);
    }
  };

  // Handle table interactions separately
  const handleTableItemClick = (item: any) => {
    if (item?.type === "refresh") {
      // Refresh the table by triggering the useEffect
      setTableRefreshTrigger((prev) => prev + 1);
      fetchWorkflows();
      return;
    }

    // Handle navigation in table view
    if (item?.type === "playbookVersion") {
      router.push(`/workflow/${item.parent_id}`);
    }
  };

  const handleCreateSuccess = () => {
    fetchWorkflows();
    setOpenModal(false);
  };

  console.log(tableItems);

  return (
    <div className="flex h-screen bg-[#131B2F] text-white">
      {/* <Sidebar /> */}

      <div className="flex-1 overflow-auto">
        <div className="max-w-screen-xl mx-auto p-9">
          <div>
            <h1 className="text-[24px] font-bold text-white">Collections</h1>
          </div>

          <div className="py-2"></div>

          <div className="w-full py-5 flex justify-between items-center bg-[#071026]/60 rounded-xl backdrop-blur-sm px-6 shadow-lg shadow-[#00F6FF]/5 border border-[#00F6FF]/10 mb-8">
            {/* Left side: View toggles with modern design */}
            <div className="flex items-center gap-6">
              <div className="relative bg-[#0A162E] rounded-lg p-1 shadow-inner shadow-black/20 w-52">
                <div
                  className={`absolute h-[85%] top-[7.5%] rounded-lg bg-gradient-to-r from-[#00F6FF] to-[#61DDFF] transition-all duration-300 ease-in-out ${
                    currentView === "board"
                      ? "left-[2%] w-[48%]"
                      : "left-[50%] w-[48%]"
                  }`}
                />
                <div className="relative z-10 flex justify-between">
                  <button
                    onClick={() => setCurrentView("board")}
                    className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-300 w-24 ${
                      currentView === "board"
                        ? "text-[#071026]"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <Grid size={16} />
                    <span>Board</span>
                  </button>
                  <button
                    onClick={() => setCurrentView("list")}
                    className={`flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors duration-300 w-24 ${
                      currentView === "list"
                        ? "text-[#071026]"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                  >
                    <List size={16} />
                    <span>List</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right side: Search and controls */}
            <div className="flex items-center gap-4">
              {/* Modern search input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="text-gray-400" size={16} />
                </div>
                <input
                  type="text"
                  placeholder="Search Workflows"
                  onChange={handleSearch}
                  className="bg-[#0A162E] pl-10 pr-4 py-2.5 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00F6FF]/50 border border-gray-800 hover:border-gray-700 transition-colors w-[220px]"
                />
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-gradient-to-b from-[#00F6FF]/20 via-[#00F6FF]/40 to-[#00F6FF]/20"></div>

              {/* Action buttons */}
              <div className="flex gap-2 items-center">
                <div className="flex bg-[#0A162E] rounded-lg p-1 border border-gray-800">
                  <button className="p-2 rounded-lg text-gray-400 hover:text-[#00F6FF] hover:bg-[#071026] transition-colors">
                    <FileText size={18} />
                  </button>
                  <button className="p-2 rounded-lg text-gray-400 hover:text-[#00F6FF] hover:bg-[#071026] transition-colors">
                    <Sliders size={18} />
                  </button>
                  <button className="p-2 rounded-lg text-gray-400 hover:text-[#00F6FF] hover:bg-[#071026] transition-colors">
                    <LayoutGrid size={18} />
                  </button>
                </div>

                {/* Add button with animated hover effect */}
                <button
                  onClick={() => setOpenModal(true)}
                  className="bg-gradient-to-r from-[#00F6FF] to-[#61DDFF] p-[1px] rounded-full group hover:shadow-lg hover:shadow-[#00F6FF]/20 transition-all duration-300"
                >
                  <div className="bg-[#071026] rounded-full p-2 group-hover:bg-[#0A162E] transition-colors">
                    <CirclePlus
                      className="text-[#00F6FF] group-hover:scale-110 transition-transform duration-300"
                      size={20}
                    />
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Workflow content */}
          <div className="mt-8">
            <WorkflowForm
              openModal={openModal}
              setOpenModal={setOpenModal}
              onSuccess={handleCreateSuccess}
            />

            {currentView === "board" ? (
              <>
                {/* Breadcrumb Navigation - Only shown in Board View */}
                {breadcrumbItems.length >= 0 && (
                  <div className="mb-5 p-3 rounded-md">
                    <div className="flex items-center space-x-1 text-sm">
                      <button
                        onClick={() => handleBreadcrumbNavigation(null, -1)}
                        className="flex items-center text-gray-400 hover:text-white transition-colors"
                      >
                        <Home size={16} />
                        <span className="ml-1">Collections</span>
                      </button>

                      {breadcrumbItems.map((item, index) => (
                        <React.Fragment key={item.id}>
                          <ChevronRight size={14} className="text-gray-600" />
                          <button
                            onClick={() =>
                              handleBreadcrumbNavigation(item, index)
                            }
                            className={`hover:text-white transition-colors ${
                              index === breadcrumbItems.length - 1
                                ? "text-white font-medium"
                                : "text-gray-400"
                            }`}
                          >
                            {item.name}
                          </button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

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
                    : cardItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleCardClick(item)}
                        >
                          <WorkflowCard
                            workflow={item}
                            handleOpenDialog={handleOpenDialog}
                            onItemClick={handleItemClick}
                          />
                        </div>
                      ))}

                  {!loading && cardItems.length === 0 && (
                    <div className="w-full py-8 text-center text-gray-400">
                      This collection is empty
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-2">
                <WorkflowTable
                  collections={allWorkflows}
                  isLoading={loading}
                  setOpenModal={setOpenModal}
                  onItemClick={handleTableItemClick}
                  refreshTrigger={tableRefreshTrigger}
                  allWorkflows={allWorkflows}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
