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
  const [currentView, setCurrentView] = useState("list");
  const [openModal, setOpenModal] = useState(false);
  const router = useRouter();

  const [cardItems, setCardItems] = useState<DisplayItem[]>([]);
  const [currentCollection, setCurrentCollection] = useState<string | null>(
    null
  );
  const [currentPlaybook, setCurrentPlaybook] = useState<string | null>(null);
  const [breadcrumbItems, setBreadcrumbItems] = useState<BreadcrumbItem[]>([]);

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

      const rootCollections = workflowList.filter((w) => w.parent_id === null);

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
      if (currentPlaybook) {
        navigateToPlaybook(currentPlaybook);
      } else if (currentCollection) {
        navigateToCollection(currentCollection);
      } else {
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
      const searchResults: DisplayItem[] = [];

      const searchInHierarchy = (collection: Collection) => {
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

        if (collection.collection) {
          collection.collection.forEach(searchInHierarchy);
        }
      };

      allWorkflows.forEach(searchInHierarchy);

      setCardItems(searchResults);
      setTableItems(searchResults);
    }
  };

  const navigateToPlaybook = (playbookId: string) => {
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

    setCurrentPlaybook(playbookId);
    setCurrentCollection(parentCollection.id);

    const breadcrumbPath: BreadcrumbItem[] = [];

    breadcrumbPath.push({
      id: foundPlaybook.id,
      name: foundPlaybook.name,
      type: "playbook",
    });

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
    setCurrentPlaybook(null);

    if (collectionId === null) {
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

    const collection = findCollectionById(allWorkflows, collectionId);
    if (!collection) return;

    setCurrentCollection(collectionId);

    const breadcrumbPath: BreadcrumbItem[] = [];
    let currentItem: Collection | undefined = collection;

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

    const displayItems: DisplayItem[] = [];

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
  };

  const handleItemClick = (item: any) => {
    console.log("View playbook:", item);
  };

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
      navigateToCollection(null);
    } else if (item.type === "collection") {
      navigateToCollection(item.id);

      setBreadcrumbItems(breadcrumbItems.slice(0, index + 1));
    } else if (item.type === "playbook") {
      navigateToPlaybook(item.id);

      setBreadcrumbItems(breadcrumbItems.slice(0, index + 1));
    }
  };

  const handleCardClick = (item: DisplayItem) => {
    if (item.type === "collection") {
      navigateToCollection(item.id);
    } else if (item.type === "playbook") {
      navigateToPlaybook(item.id);
    } else if (item.type === "playbookVersion") {
      router.push(`/playbook/${item.parent_id}`);
    }
  };

  const handleTableItemClick = (item: any) => {
    if (item?.type === "refresh") {
      setTableRefreshTrigger((prev) => prev + 1);
      fetchWorkflows();
      return;
    }

    if (item?.type === "playbookVersion") {
      router.push(`/playbook/${item.parent_id}`);
    }
  };

  const handleCreateSuccess = () => {
    fetchWorkflows();
    setOpenModal(false);
  };

  console.log(tableItems);

  return (
    <div className="flex h-full bg-[#131B2F] text-white">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-screen-xl mx-auto p-9">
          <div>
            <h1 className="text-[24px] font-bold text-white">Collections</h1>
          </div>

          <div className="py-2"></div>

          <div className="w-full py-5 flex justify-between items-center bg-[#071026]/60 rounded-xl px-6 shadow-lg shadow-[#00F6FF]/5 border border-[#00F6FF]/10 mb-8">
            <div className="flex items-center gap-6">
              <div className="relative bg-[#0A162E] rounded-lg p-1 shadow-inner shadow-black/20 w-52">
                <div
                  className={`absolute h-[85%] top-[7.5%] rounded-lg bg-gradient-to-r from-[#00F6FF] to-[#61DDFF] transition-all duration-300 ease-in-out ${
                    currentView === "list"
                      ? "left-[2%] w-[48%]"
                      : "left-[50%] w-[48%]"
                  }`}
                />
                <div className="relative z-10 flex justify-between">
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
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
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

              <div className="h-8 w-px bg-gradient-to-b from-[#00F6FF]/20 via-[#00F6FF]/40 to-[#00F6FF]/20"></div>

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

          <div className="mt-8">
            <WorkflowForm
              openModal={openModal}
              setOpenModal={setOpenModal}
              onSuccess={handleCreateSuccess}
            />

            {currentView === "board" ? (
              <>
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
