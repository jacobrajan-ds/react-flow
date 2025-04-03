"use client";

import React, { useState, useMemo, useCallback } from "react";
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
  Play,
  Trash2,
  Plus,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import axiosInstance from "@/utils/axios";

// Types definitions remain the same
interface Playbook {
  id: string;
  name: string;
  description: string;
  collection_id: string;
  owner_id?: string;
  playbook_version?: any[];
}

interface Collection {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  playbook: Playbook[];
  collection: Collection[];
}

interface TableRow {
  id: string;
  name: string;
  description: string;
  parent_id: string | null;
  type: "collection" | "playbook";
  level: number;
  hasChildren: boolean;
  isPlaybook: boolean;
  collection_id?: string;
}

interface CollectionTableProps {
  collections: any[];
  isLoading?: boolean;
  setOpenModal: (open: boolean) => void;
}

export default function CollectionTable({
  collections = [],
  isLoading = false,
  setOpenModal,
}: CollectionTableProps) {
  const [rowSelection, setRowSelection] = useState({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [modalType, setModalType] = useState<"collection" | "playbook" | null>(
    null
  );
  const [currentParentId, setCurrentParentId] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    parent_id: "",
    owner_id: "",
    collection_id: "",
  });

  // Generate a unique dialog ID based on the modal type and parent ID
  const dialogId = useMemo(() => {
    if (!modalType) return "";
    return `${modalType}-dialog-${currentParentId}`;
  }, [modalType, currentParentId]);

  const handleOpenDialog = (
    type: "collection" | "playbook",
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
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
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

    const url =
      modalType === "collection" ? "/api/collection" : "/api/playbook";
    const payload =
      modalType === "collection"
        ? {
            name: formData.name,
            description: formData.description,
            parent_id: formData.parent_id,
          }
        : {
            name: formData.name,
            description: formData.description,
            owner_id: formData.owner_id,
            collection_id: formData.collection_id,
          };

    try {
      const response = await axiosInstance.post(url, payload);

      if (!response.ok) {
        throw new Error("Failed to create item");
      }

      const data = await response.data;
      console.log(`${modalType} created successfully:`, data);
      handleCloseDialog();
      // Optionally refresh the table or update state here
    } catch (error) {
      console.error(`Error creating ${modalType}:`, error);
    }
  };

  // Other utility functions remain the same
  const isItemPlaybook = (item: any): boolean => {
    return item && "collection_id" in item;
  };

  const hasCollectionChildren = (item: any): boolean => {
    if (isItemPlaybook(item)) return false;
    return (
      (Array.isArray(item.collection) && item.collection.length > 0) ||
      (Array.isArray(item.playbook) && item.playbook.length > 0)
    );
  };

  const toggleRowExpanded = useCallback((id: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }, []);

  const flattenCollections = useCallback(
    (items: any[], level = 0, parentId: string | null = null): TableRow[] => {
      if (!Array.isArray(items)) return [];

      let rows: TableRow[] = [];

      items.forEach((item) => {
        if (!item || !item.id) return;

        const isPlaybook = isItemPlaybook(item);
        const hasChildren = hasCollectionChildren(item);

        const row: TableRow = {
          id: item.id,
          name: item.name || "Unnamed",
          description: item.description || "",
          parent_id: parentId,
          type: isPlaybook ? "playbook" : "collection",
          level,
          hasChildren,
          isPlaybook,
        };

        if (isPlaybook) {
          row.collection_id = item.collection_id;
        }

        rows.push(row);

        if (hasChildren && expandedRows[item.id]) {
          if (Array.isArray(item.collection) && item.collection.length > 0) {
            rows = rows.concat(
              flattenCollections(item.collection, level + 1, item.id)
            );
          }

          if (Array.isArray(item.playbook) && item.playbook.length > 0) {
            rows = rows.concat(
              flattenCollections(
                item.playbook.map((p: any) => ({
                  ...p,
                  isPlaybook: true,
                  collection_id: item.id,
                })),
                level + 1,
                item.id
              )
            );
          }
        }
      });

      return rows;
    },
    [expandedRows]
  );

  const tableData = useMemo(() => {
    try {
      return flattenCollections(collections);
    } catch (error) {
      console.error("Error flattening collections:", error);
      return [];
    }
  }, [collections, flattenCollections]);

  const columnHelper = createColumnHelper<TableRow>();

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            name="select-all"
            id="select-all-checkbox"
            className="w-4 h-4 rounded border-gray-600"
            checked={table.getIsAllRowsSelected()}
            onChange={table.getToggleAllRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            name={`select-row-${row.original.id}`}
            id={`select-row-checkbox-${row.original.id}`}
            className="w-4 h-4 rounded border-gray-600"
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
        size: 40,
      }),
      // Other columns stay the same
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => {
          const row = info.row.original;
          const paddingLeft = row.level * 20;

          return (
            <div
              className="flex items-center"
              style={{ paddingLeft: `${paddingLeft}px` }}
            >
              {row.hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRowExpanded(row.id);
                  }}
                  className="mr-2 text-gray-400 hover:text-white"
                >
                  {expandedRows[row.id] ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
              ) : (
                <div className="w-6 mr-2"></div>
              )}

              {row.isPlaybook ? (
                <Link
                  href={`/playbook/${row.id}`}
                  className="flex items-center gap-2 text-white hover:text-blue-400"
                >
                  <Play size={16} className="text-green-500" />
                  <span>{info.getValue()}</span>
                </Link>
              ) : (
                <div className="flex items-center gap-2">
                  {expandedRows[row.id] ? (
                    <FolderOpen size={16} className="text-yellow-500" />
                  ) : (
                    <Folder size={16} className="text-yellow-500" />
                  )}
                  <span className="text-white">{info.getValue()}</span>
                </div>
              )}
            </div>
          );
        },
        size: 300,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => (
          <div className="text-gray-400 truncate max-w-xs">
            {info.getValue()}
          </div>
        ),
        size: 250,
      }),
      columnHelper.accessor("type", {
        header: "Type",
        cell: (info) => {
          const type = info.getValue();
          return (
            <div
              className="px-2 py-1 rounded text-xs inline-block font-medium"
              style={{
                backgroundColor: type === "collection" ? "#2D3748" : "#2C5282",
                color: type === "collection" ? "#CBD5E0" : "#BEE3F8",
              }}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </div>
          );
        },
        size: 100,
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          // Generate unique IDs for this row's dropdown elements
          const dropdownId = `dropdown-${row.original.id}`;
          const triggerButtonId = `trigger-button-${row.original.id}`;

          return (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    id={triggerButtonId}
                    className="p-2 hover:bg-gray-700 rounded-lg"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  id={dropdownId}
                  className="bg-[#1E293B] text-white border border-gray-700 rounded-lg shadow-lg p-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <DropdownMenuItem
                    id={`new-collection-menu-item-${row.original.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDialog("collection", row.original.id);
                    }}
                    className="hover:bg-gray-700 rounded-md px-2 py-1"
                  >
                    New Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    id={`new-playbook-menu-item-${row.original.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDialog("playbook", row.original.id);
                    }}
                    className="hover:bg-gray-700 rounded-md px-2 py-1"
                  >
                    Add Playbook
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          );
        },
        size: 100,
      }),
    ],
    [columnHelper, toggleRowExpanded, expandedRows]
  );

  const table = useReactTable({
    data: tableData,
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
      <div className="bg-[#131B2F]">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/4"></div>
          <div className="h-12 bg-gray-800 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#131B2F]">
      {/* Single Dialog Instance (moved outside the table) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#1E293B] border border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white">
              {modalType === "collection" ? "New Collection" : "New Playbook"}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {modalType === "collection"
                ? "Fill out the details to create a new collection."
                : "Fill out the details to create a new playbook."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
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
          </div>

          <DialogFooter>
            <button
              type="button"
              id={`${dialogId}-cancel-button`}
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
              id={`${dialogId}-save-button`}
              onClick={handleSubmit}
              className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-500"
            >
              Save
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-white">
            Collections & Playbooks
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                id="create-new-button"
                className="bg-[#071026] border border-[#00F6FF] text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Create New
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              id="create-new-dropdown"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuItem
                id="create-new-collection-menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDialog("collection", "root");
                }}
              >
                New Collection
              </DropdownMenuItem>
              <DropdownMenuItem
                id="create-new-playbook-menu-item"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDialog("playbook", "root");
                }}
              >
                New Playbook
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div> */}
      <div className="bg-[#0A162E] rounded-lg border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full rounded-lg">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-gray-800 bg-[#071026]"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-400"
                      style={{ width: header.getSize() }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-gray-800 hover:bg-[#131B2F]"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3"
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
                    No collections or playbooks found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select
              name="items-per-page"
              id="items-per-page-select"
              className="bg-[#071026] text-gray-400 border border-gray-700 rounded-lg px-2 py-1"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span className="text-gray-400">Items per page</span>
          </div>

          <div className="flex items-center gap-4 text-gray-400">
            <span>
              1 to {tableData.length} of {tableData.length}
            </span>
            <div className="flex gap-2">
              <button
                id="prev-page-button"
                className="p-1 hover:bg-gray-700 rounded"
                aria-label="Previous page"
              >
                ←
              </button>
              <button
                id="next-page-button"
                className="p-1 hover:bg-gray-700 rounded"
                aria-label="Next page"
              >
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
