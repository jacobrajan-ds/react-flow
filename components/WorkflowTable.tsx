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

interface FormData {
  name: string;
  description: string;
  parent_id: string;
  owner_id: string;
  collection_id: string;
  playbook_id: string;
  execution_mode: string;
  version: string;
  module_code: string;
  playbook: string;
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

  const [internalItems, setInternalItems] = useState<any[]>([]);

  useEffect(() => {
    setInternalItems(collections);
  }, [collections]);

  useEffect(() => {
    if (refreshTrigger > 0) {
      setExpandedRows({});
    }
  }, [refreshTrigger]);

  const currentDate = "2025-04-04 05:49:57";
  const currentUser = "imjacobrajan";

  const dialogId = useMemo(() => {
    if (!modalType) return "";
    return `${modalType}-dialog-${currentParentId}`;
  }, [modalType, currentParentId]);

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
      execution_mode: "MANUAL",
      version: "1.0.0",
      module_code: "",
      playbook: type === "playbookVersion" ? parentId : "",
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
        version: formData.version,
        execution_mode: formData.execution_mode,
        module_code: formData.module_code,
        playbook: formData.playbook_id,
        is_latest: true,
        is_active: true,
      };
    }

    try {
      const response = await axiosInstance.post(url, payload);

      if (response && response.status >= 200 && response.status < 300) {
        handleCloseDialog();
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
      setExpandedRows((prev) => {
        const newState = { ...prev };
        newState[id] = !prev[id];
        return newState;
      });
    },
    [expandedRows]
  );

  const processItems = useCallback((items: any[]): WorkflowItem[] => {
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
        const itemCollection = item.collection || [];
        const itemPlaybook = item.playbook || [];

        const hasCollections =
          Array.isArray(itemCollection) && itemCollection.length > 0;
        const hasPlaybooks =
          Array.isArray(itemPlaybook) && itemPlaybook.length > 0;

        const collectionCount = hasCollections ? itemCollection.length : 0;
        const playbookCount = hasPlaybooks ? itemPlaybook.length : 0;

        const hasChildren = collectionCount > 0 || playbookCount > 0;

        const processedCollections = hasCollections
          ? processItems(itemCollection)
          : [];

        const processedPlaybooks = [];
        if (hasPlaybooks) {
          for (const playbook of itemPlaybook) {
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

        const children = [...processedCollections, ...processedPlaybooks];

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
        return workflowItem;
      })
      .filter(Boolean) as WorkflowItem[];
  }, []);

  const flattenTree = useCallback(
    (items: WorkflowItem[], level = 0): WorkflowItem[] => {
      if (!items || !Array.isArray(items)) return [];

      let result: WorkflowItem[] = [];

      for (const item of items) {
        const newItem = {
          ...item,
          level,
          isExpanded: expandedRows[item.id] || false,
        };

        result.push(newItem);

        if (
          expandedRows[item.id] &&
          item.children &&
          item.children.length > 0
        ) {
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

  const prepareDataForProcessing = useCallback((items: any[]): any[] => {
    if (items && items.length > 0) {
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

    return JSON.parse(JSON.stringify(items));
  }, []);

  const processedData = useMemo(() => {
    const preparedData = prepareDataForProcessing(internalItems);
    const tree = processItems(preparedData);
    return flattenTree(tree);
  }, [internalItems, processItems, flattenTree, prepareDataForProcessing]);

  const columnHelper = createColumnHelper<WorkflowItem>();

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
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
              {shouldShowChevron ? (
                <div
                  onClick={(e) => {
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
                <div className="w-[34px] mr-2"></div>
              )}

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

                  {data.type === "playbookVersion" && (
                    <>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
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
    data: processedData,
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#1E293B] border border-gray-700">
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
              <>
                <div className="grid grid-cols-8 items-center gap-4">
                  <label
                    htmlFor={`${dialogId}-version-field`}
                    className="text-left text-gray-300 col-span-3"
                  >
                    Version *
                  </label>
                  <input
                    id={`${dialogId}-version-field`}
                    name="version"
                    value={formData.version || ""}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. 1.0.0"
                    className="col-span-5 bg-[#0F172A] text-white border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-8 items-center gap-4">
                  <label
                    htmlFor={`${dialogId}-execution-mode-field`}
                    className=" text-gray-300 col-span-3"
                  >
                    Execution Mode *
                  </label>
                  <select
                    id={`${dialogId}-execution-mode-field`}
                    name="execution_mode"
                    value={formData.execution_mode || "MANUAL"}
                    onChange={handleInputChange}
                    required
                    className="col-span-5 bg-[#0F172A] text-white border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MANUAL">MANUAL</option>
                    <option value="ON_CREATE">ON_CREATE</option>
                    <option value="ON_UPDATE">ON_UPDATE</option>
                    <option value="ON_DELETE">ON_DELETE</option>
                    <option value="SUB">SUB</option>
                    <option value="WEBHOOK">WEBHOOK</option>
                  </select>
                </div>

                <div className="grid grid-cols-8 items-center gap-4">
                  <label
                    htmlFor={`${dialogId}-module-code-field`}
                    className="text-left text-gray-300 col-span-3"
                  >
                    Module Code *
                  </label>
                  <input
                    id={`${dialogId}-module-code-field`}
                    name="module_code"
                    value={formData.module_code || ""}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter module code"
                    className=" col-span-5 bg-[#0F172A] text-white border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 "
                  />
                </div>

                <div className="grid grid-cols-8 items-center gap-4">
                  <label
                    htmlFor={`${dialogId}-playbook-id-field`}
                    className="text-left text-gray-300 col-span-3"
                  >
                    Playbook ID *
                  </label>
                  <input
                    id={`${dialogId}-playbook-id-field`}
                    name="playbook"
                    value={formData.playbook_id || ""}
                    onChange={handleInputChange}
                    disabled
                    className="col-span-5 bg-[#0F172A] text-white border border-gray-700 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 opacity-70"
                  />
                </div>
              </>
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
