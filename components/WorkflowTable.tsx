"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  BookOpen,
  FileCode,
  Plus,
  MoreVertical,
  GitBranch,
  Clock,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import axiosInstance from "@/utils/axios";
import { Play } from "lucide-react";
import Link from "next/link";

// Types (same as before)
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
  owner_id?: string;
  playbook_version?: PlaybookVersion[];
}

interface Collection {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  playbook: Playbook[];
  collection: Collection[];
}

interface WorkflowItem {
  id: string;
  name: string;
  description: string;
  type: "collection" | "playbook" | "playbookVersion" | "placeholder";
  parent_id?: string | null;
  isExpanded?: boolean;
  level: number;
  hasChildren?: boolean;
  children?: WorkflowItem[];
  metadata?: any;
  collectionCount?: number;
  playbookCount?: number;
  versionCount?: number;
  version_info?: PlaybookVersion;
}

interface CollectionTableProps {
  collections: any[];
  isLoading?: boolean;
  setOpenModal: (open: boolean) => void;
  onItemClick?: (item: any) => void;
  refreshTrigger?: number;
  allWorkflows?: Collection[];
}

export default function WorkflowTable({
  collections = [],
  isLoading = false,
  setOpenModal,
  onItemClick,
  refreshTrigger = 0,
  allWorkflows = [],
}: CollectionTableProps) {
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [modalType, setModalType] = useState<
    "collection" | "playbook" | "playbookVersion" | null
  >(null);
  const [currentParentId, setCurrentParentId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: "",
    owner_id: "",
    collection_id: "",
    playbook_id: "",
    execution_mode: "Manual",
  });

  // Internal items state - no longer uses parent's displayItems directly
  const [internalItems, setInternalItems] = useState<any[]>([]);

  // Update internal items when collections prop changes
  useEffect(() => {
    setInternalItems(collections);
  }, [collections]);

  useEffect(() => {
    console.log("Raw collections data:", collections);
  }, [collections]);

  // Reset expanded rows when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      setExpandedRows({});
    }
  }, [refreshTrigger]);

  // Current date and user information
  const currentDate = "2025-04-04 05:49:57";
  const currentUser = "imjacobrajan";

  // Generate a unique dialog ID
  const dialogId = useMemo(() => {
    if (!modalType) return "";
    return `${modalType}-dialog-${currentParentId}`;
  }, [modalType, currentParentId]);
  useEffect(() => {
    console.log("Raw collections prop:", collections);

    if (collections && collections.length > 0) {
      console.log(
        "Sample collection structure:",
        JSON.stringify(collections[0], null, 2)
      );
    }
  }, [collections]);
  const handleOpenDialog = (
    type: "collection" | "playbook" | "playbookVersion",
    parentId: string
  ) => {
    setModalType(type);
    setCurrentParentId(parentId);
    setFormData({
      name: "",
      description: "",
      parent_id: type === "collection" ? parentId : "",
      owner_id: "",
      collection_id: type === "playbook" ? parentId : "",
      playbook_id: type === "playbookVersion" ? parentId : "",
      execution_mode: "Manual",
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setModalType(null);
    setCurrentParentId("");
    setFormData({
      name: "",
      description: "",
      parent_id: "",
      owner_id: "",
      collection_id: "",
      playbook_id: "",
      execution_mode: "Manual",
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    e.stopPropagation();
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let url = "/api/collection";
    let payload = {};

    if (modalType === "collection") {
      url = "/api/collection";
      payload = {
        name: formData.name,
        description: formData.description,
        parent_id: formData.parent_id,
      };
    } else if (modalType === "playbook") {
      url = "/api/playbook";
      payload = {
        name: formData.name,
        description: formData.description,
        owner_id: formData.owner_id || "default_user",
        collection_id: formData.collection_id,
      };
    } else if (modalType === "playbookVersion") {
      url = "/api/playbook-version";
      payload = {
        version_number: 1, // Default for new version
        execution_mode: formData.execution_mode,
        module_code: "// Default code",
        is_latest: true,
        is_active: true,
        playbook_id: formData.playbook_id,
      };
    }

    try {
      const response = await axiosInstance.post(url, payload);

      if (response && response.status >= 200 && response.status < 300) {
        console.log(`${modalType} created successfully:`, response.data);
        handleCloseDialog();
        // Notify parent component about refresh
        if (onItemClick) {
          onItemClick({ type: "refresh" });
        }
      } else {
        throw new Error("Failed to create item");
      }
    } catch (error) {
      console.error(`Error creating ${modalType}:`, error);
    }
  };

  const toggleRowExpanded = useCallback(
    (id: string, event?: React.MouseEvent) => {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      console.log(
        `Toggling row ${id}, current expanded state:`,
        expandedRows[id]
      );

      setExpandedRows((prev) => {
        const newState = { ...prev };
        newState[id] = !prev[id];
        console.log(`Set row ${id} expanded to:`, newState[id]);
        return newState;
      });
    },
    [expandedRows]
  );

  // In your processItems function
  const processItems = useCallback((items: any[]): WorkflowItem[] => {
    console.log("Processing items:", items);

    if (!items || !Array.isArray(items)) {
      console.log("Items is not an array or is empty");
      return [];
    }

    return items
      .map((item) => {
        if (!item || !item.id) {
          console.log("Invalid item:", item);
          return null;
        }

        // Log the raw item to see its structure
        console.log("Raw item structure:", JSON.stringify(item, null, 2));

        // Safely check collection and playbook properties
        const itemCollection = item.collection || [];
        const itemPlaybook = item.playbook || [];

        // Check for children directly in the data
        const hasCollections =
          Array.isArray(itemCollection) && itemCollection.length > 0;
        const hasPlaybooks =
          Array.isArray(itemPlaybook) && itemPlaybook.length > 0;

        console.log(
          `Item ${item.name} (${item.id}) direct children check:`,
          "collections:",
          hasCollections ? itemCollection.length : 0,
          "playbooks:",
          hasPlaybooks ? itemPlaybook.length : 0
        );

        // Calculate counts for display
        const collectionCount = hasCollections ? itemCollection.length : 0;
        const playbookCount = hasPlaybooks ? itemPlaybook.length : 0;

        // Explicitly determine if the item has children
        const hasChildren = collectionCount > 0 || playbookCount > 0;

        // Process sub-collections if they exist
        const processedCollections = hasCollections
          ? processItems(itemCollection)
          : [];

        // Process playbooks and their versions
        const processedPlaybooks = [];
        if (hasPlaybooks) {
          for (const playbook of itemPlaybook) {
            // Create the playbook item
            const playbookItem: WorkflowItem = {
              id: playbook.id,
              name: playbook.name || "Unnamed Playbook",
              description: playbook.description || "",
              type: "playbook" as const,
              parent_id: item.id,
              level: 0,
              hasChildren:
                Array.isArray(playbook.playbook_version) &&
                playbook.playbook_version.length > 0,
              children: [],
              metadata: playbook,
            };

            // Process playbook versions if they exist
            if (
              Array.isArray(playbook.playbook_version) &&
              playbook.playbook_version.length > 0
            ) {
              playbookItem.children = playbook.playbook_version.map(
                (version) => ({
                  id: version.id,
                  name: `Version ${
                    version.version || version.version_number || "1.0.0"
                  }`,
                  description: version.execution_mode || "",
                  type: "playbookVersion" as const,
                  parent_id: playbook.id,
                  level: 0,
                  hasChildren: false,
                  children: [],
                  metadata: version,
                })
              );
            }

            processedPlaybooks.push(playbookItem);
          }
        }

        // Combine collections and playbooks as children
        const children = [...processedCollections, ...processedPlaybooks];

        // Create the workflow item
        const workflowItem: WorkflowItem = {
          id: item.id,
          name: item.name || "Unnamed",
          description: item.description || "",
          type: "collection",
          parent_id: item.parent || item.parent_id || null,
          level: 0,
          hasChildren,
          children,
          collectionCount,
          playbookCount,
          metadata: item,
        };

        console.log(
          "Created workflow item:",
          `${workflowItem.name} (${workflowItem.id})`,
          "hasChildren:",
          workflowItem.hasChildren,
          "childCount:",
          workflowItem.children.length
        );

        return workflowItem;
      })
      .filter(Boolean) as WorkflowItem[];
  }, []);

  const flattenTree = useCallback(
    (items: WorkflowItem[], level = 0): WorkflowItem[] => {
      if (!items || !Array.isArray(items)) return [];

      let result: WorkflowItem[] = [];

      for (const item of items) {
        // Create a copy of the item with the current level
        const newItem = {
          ...item,
          level,
          isExpanded: expandedRows[item.id] || false,
        };

        // Add the current item to the result
        result.push(newItem);

        // If expanded, include children
        if (
          expandedRows[item.id] &&
          item.children &&
          item.children.length > 0
        ) {
          console.log(
            `Row ${item.id} is expanded, has ${item.children.length} children`
          );

          const childrenWithUpdatedLevel = item.children.map((child) => ({
            ...child,
            level: level + 1,
          }));

          const flattenedChildren = flattenTree(
            childrenWithUpdatedLevel,
            level + 1
          );
          result = result.concat(flattenedChildren);
        }
      }

      return result;
    },
    [expandedRows]
  );

  // Convert collections to a proper hierarchical structure before processing
  const prepareDataForProcessing = useCallback((items: any[]): any[] => {
    console.log("Preparing raw data for processing:", items);

    if (items && items.length > 0) {
      console.log("First item structure:", JSON.stringify(items[0], null, 2));

      // Check if the collection property exists
      if (items[0].collection) {
        console.log(
          "Collection property exists, first collection:",
          items[0].collection.length > 0
            ? items[0].collection[0]
            : "empty collection"
        );
      } else {
        console.warn("Collection property is missing or not accessible");
      }
    }

    // Deep clone the items to avoid modifying the original
    return JSON.parse(JSON.stringify(items));
  }, []);

  // Process the data for the table - completely independent of parent state now
  const processedData = useMemo(() => {
    // Prepare the data by establishing proper hierarchy
    const preparedData = prepareDataForProcessing(internalItems);

    // Process the prepared data into our internal format
    const tree = processItems(preparedData);

    // Flatten the tree for table display
    return flattenTree(tree);
  }, [internalItems, processItems, flattenTree, prepareDataForProcessing]);

  const columnHelper = createColumnHelper<WorkflowItem>();

  const columns = useMemo(
    () => [
      // Name column with toggle functionality
      columnHelper.accessor("name", {
        header: "Name",
        // In your name column definition:
        // In your column cell definition:
        // In your column cell definition:
        cell: (info) => {
          const row = info.row.original;
          const paddingLeft = row.level * 24;

          const shouldShowChevron = row.hasChildren === true;

          return (
            <div
              className="flex items-center py-2 cursor-pointer group"
              style={{ paddingLeft: `${paddingLeft}px` }}
              onClick={() => {
                if (onItemClick) {
                  onItemClick(row);
                }
              }}
            >
              {/* Show toggle button for items with children */}
              {shouldShowChevron ? (
                <div
                  onClick={(e) => {
                    console.log("Chevron clicked for row:", row.id);
                    e.preventDefault();
                    e.stopPropagation();
                    toggleRowExpanded(row.id, e);
                  }}
                  className="mr-2 p-2 hover:bg-gray-700 rounded cursor-pointer"
                >
                  {expandedRows[row.id] ? (
                    <ChevronDown size={18} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={18} className="text-gray-400" />
                  )}
                </div>
              ) : (
                // For consistent spacing when no chevron
                <div className="w-[34px] mr-2"></div>
              )}

              {/* Display appropriate icon and name based on type */}
              <div className="flex items-center gap-2">
                {row.type === "collection" ? (
                  <div className="flex items-center">
                    {expandedRows[row.id] ? (
                      <FolderOpen size={16} className="text-yellow-500" />
                    ) : (
                      <Folder size={16} className="text-yellow-500" />
                    )}
                    <span className="ml-2 text-white">{row.name}</span>
                  </div>
                ) : row.type === "playbook" ? (
                  <div className="flex items-center">
                    <Play size={16} className="text-green-500" />
                    <span className="ml-2 text-white">{row.name}</span>
                  </div>
                ) : row.type === "playbookVersion" ? (
                  <div className="flex items-center">
                    <FileCode size={16} className="text-teal-500" />
                    <Link
                      href={`/playbook/${row.id}`}
                      className="ml-2 text-white hover:text-blue-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {row.name}
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="ml-2 text-gray-400">{row.name}</span>
                  </div>
                )}
              </div>
            </div>
          );
        },
        size: 350,
      }),
      // Rest of columns remain the same
      columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => (
          <div className="text-gray-400 truncate max-w-xs">
            {info.getValue() || "No description provided"}
          </div>
        ),
        size: 250,
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: (info) => {
          const row = info.row.original;
          const type = info.getValue();
          let bgColor = "bg-[#071026]";
          let textColor = "text-gray-300";
          let icon = null;
          let typeText = "Unknown";

          if (type === "collection") {
            bgColor = "bg-[#0A162E]";
            textColor = "text-blue-300";
            typeText = "Collection";
            icon = <Folder size={12} className="text-blue-400" />;
          } else if (type === "playbook") {
            bgColor = "bg-[#16142D]";
            textColor = "text-purple-300";
            typeText = "Playbook";
            icon = <BookOpen size={12} className="text-purple-400" />;
          } else if (type === "playbookVersion") {
            bgColor = "bg-[#0D2322]";
            textColor = "text-teal-300";
            typeText = "Version";
            icon = <FileCode size={12} className="text-teal-400" />;
          }

          return (
            <div className="flex items-center gap-3">
              <div
                className={`px-2 py-1 rounded text-xs inline-flex items-center gap-1.5 ${bgColor} ${textColor} font-medium`}
              >
                {icon}
                {typeText}
              </div>

              {/* Content summary */}
              {type === "collection" &&
                ((row.collectionCount ?? 0) > 0 ||
                  (row.playbookCount ?? 0) > 0) && (
                  <div className="flex items-center gap-2 text-xs">
                    {(row.collectionCount ?? 0) > 0 && (
                      <div className="flex items-center text-blue-400">
                        <Folder size={12} className="mr-1" />
                        <span>{row.collectionCount}</span>
                      </div>
                    )}
                    {(row.playbookCount ?? 0) > 0 && (
                      <div className="flex items-center text-purple-400 ml-2">
                        <BookOpen size={12} className="mr-1" />
                        <span>{row.playbookCount}</span>
                      </div>
                    )}
                  </div>
                )}

              {type === "playbook" && (
                <div className="flex items-center text-xs">
                  {(row.versionCount ?? 0) > 0 ? (
                    <div className="flex items-center text-teal-400">
                      <GitBranch size={12} className="mr-1" />
                      <span>
                        {row.versionCount} version
                        {row.versionCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-500">
                      <GitBranch size={12} className="mr-1" />
                      <span>No versions</span>
                    </div>
                  )}
                </div>
              )}

              {type === "playbookVersion" && row.version_info && (
                <div className="flex items-center text-xs text-gray-400">
                  <FileCode size={12} className="mr-1" />
                  <span>{row.version_info.execution_mode} Mode</span>
                </div>
              )}
            </div>
          );
        },
        size: 250,
      }),

      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const data = row.original;

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-[#0A162E] transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-[#1E293B] text-white border border-gray-700 rounded-lg shadow-lg p-2 min-w-[180px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Collection actions */}
                  {data.type === "collection" && (
                    <>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog("collection", data.id);
                        }}
                        className="hover:bg-gray-700 rounded-md px-2 py-1.5 cursor-pointer flex items-center gap-2"
                      >
                        <Plus size={16} className="text-blue-400" />
                        New Collection
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog("playbook", data.id);
                        }}
                        className="hover:bg-gray-700 rounded-md px-2 py-1.5 cursor-pointer flex items-center gap-2"
                      >
                        <Plus size={16} className="text-purple-400" />
                        New Playbook
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Playbook actions */}
                  {data.type === "playbook" && (
                    <>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onItemClick) onItemClick(data);
                        }}
                        className="hover:bg-gray-700 rounded-md px-2 py-1.5 cursor-pointer flex items-center gap-2"
                      >
                        <BookOpen size={16} className="text-purple-400" />
                        View Playbook
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-gray-700 my-1" />
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDialog("playbookVersion", data.id);
                        }}
                        className="hover:bg-gray-700 rounded-md px-2 py-1.5 cursor-pointer flex items-center gap-2"
                      >
                        <Plus size={16} className="text-teal-400" />
                        New Version
                      </DropdownMenuItem>
                    </>
                  )}

                  {/* Version actions */}
                  {data.type === "playbookVersion" && (
                    <>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle execution
                          if (onItemClick)
                            onItemClick({ ...data, action: "run" });
                        }}
                        className="hover:bg-gray-700 rounded-md px-2 py-1.5 cursor-pointer flex items-center gap-2"
                      >
                        <GitBranch size={16} className="text-teal-400" />
                        Run Playbook
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 80,
      }),
    ],
    [
      onItemClick,
      toggleRowExpanded,
      expandedRows,
      currentDate,
      currentUser,
      handleOpenDialog,
    ]
  );

  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data: processedData, // Use the flattened data
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });
  useEffect(() => {
    console.log("Processed data for table:", processedData);
    console.log("Expanded rows:", expandedRows);
  }, [processedData, expandedRows]);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-b from-[#0A162E] to-[#131B2F] rounded-xl p-6 shadow-lg border border-[#00F6FF]/10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#071026] rounded-lg w-1/4"></div>
          <div className="h-12 bg-[#071026] rounded-lg"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-[#071026] rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-[#0A162E] to-[#131B2F] rounded-xl shadow-lg border border-[#00F6FF]/10 overflow-hidden">
      {/* Dialog for creating new items */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#1E293B] border border-gray-700">
          {/* Dialog Content - same as before */}
          <DialogHeader>
            <DialogTitle className="text-white">
              {modalType === "collection" && "New Collection"}
              {modalType === "playbook" && "New Playbook"}
              {modalType === "playbookVersion" && "New Playbook Version"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {modalType === "collection" &&
                "Fill out the details to create a new collection."}
              {modalType === "playbook" &&
                "Fill out the details to create a new playbook."}
              {modalType === "playbookVersion" &&
                "Create a new version of this playbook."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Dialog form fields */}
            {(modalType === "collection" || modalType === "playbook") && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label
                    htmlFor={`${dialogId}-name-field`}
                    className="text-right text-gray-300"
                  >
                    Name
                  </label>
                  <input
                    id={`${dialogId}-name-field`}
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="col-span-3 bg-[#0F172A] text-white border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="off"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label
                    htmlFor={`${dialogId}-description-field`}
                    className="text-right text-gray-300"
                  >
                    Description
                  </label>
                  <textarea
                    id={`${dialogId}-description-field`}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="col-span-3 bg-[#0F172A] text-white border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {modalType === "playbook" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor={`${dialogId}-owner-id-field`}
                  className="text-right text-gray-300"
                >
                  Owner ID
                </label>
                <input
                  id={`${dialogId}-owner-id-field`}
                  name="owner_id"
                  value={formData.owner_id}
                  onChange={handleInputChange}
                  className="col-span-3 bg-[#0F172A] text-white border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {modalType === "playbookVersion" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <label
                  htmlFor={`${dialogId}-execution-mode-field`}
                  className="text-right text-gray-300"
                >
                  Execution Mode
                </label>
                <select
                  id={`${dialogId}-execution-mode-field`}
                  name="execution_mode"
                  value={formData.execution_mode}
                  onChange={handleInputChange}
                  className="col-span-3 bg-[#0F172A] text-white border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Manual">Manual</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Webhook">Webhook</option>
                </select>
              </div>
            )}
          </div>

          <DialogFooter>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCloseDialog();
              }}
              className="px-4 py-2 rounded-md bg-gray-700 text-white hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 rounded-md bg-gradient-to-r from-[#00F6FF] to-[#61DDFF] text-[#071026] font-medium hover:shadow-lg hover:shadow-[#00F6FF]/20 transition-all"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Main table */}
      <div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#071026]">
                {table.getFlatHeaders().map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-400 first:rounded-tl-lg last:rounded-tr-lg"
                    style={{ width: header.getSize() }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row, rowIndex) => (
                  <tr
                    key={row.id}
                    className={`border-t border-gray-800/30 hover:bg-[#071026]/40 transition-colors cursor-pointer ${
                      rowIndex % 2 === 0 ? "bg-[#071026]/20" : ""
                    }`}
                    onClick={() => {
                      if (onItemClick) {
                        onItemClick(row.original);
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4"
                        style={{ width: cell.column.getSize() }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="mb-2 text-lg">
                        This collection is empty
                      </div>
                      <button
                        onClick={() => setOpenModal(true)}
                        className="text-[#00F6FF] hover:underline flex items-center gap-2"
                      >
                        <Plus size={16} />
                        Create a new item
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-gray-800/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">
              {processedData.length} item{processedData.length !== 1 ? "s" : ""}
            </span>
          </div>

          <button
            onClick={() => setOpenModal(true)}
            className="bg-gradient-to-r from-[#00F6FF] to-[#61DDFF] p-[1px] rounded-lg group hover:shadow-lg hover:shadow-[#00F6FF]/20 transition-all duration-300"
          >
            <div className="bg-[#071026] rounded-lg px-3 py-1.5 group-hover:bg-[#0A162E] transition-colors flex items-center gap-2">
              <Plus className="text-[#00F6FF]" size={16} />
              <span className="text-white text-sm">Create New</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
