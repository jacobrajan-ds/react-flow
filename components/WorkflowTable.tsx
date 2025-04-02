"use client";

import React from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Clock, FileText, Trash2, User, Plus } from "lucide-react";
import Image from "next/image";

interface Workflow {
  id: string;
  name: string;
  description: string;
  parent_id?: string;
  actions?: { app_name?: string; large_image?: string }[];
  triggers?: { id: string; name: string }[];
  schedules?: number;
}

interface WorkflowTableProps {
  workflows: Workflow[];
  isLoading?: boolean;
  setOpenModal: (open: boolean) => void;
}

export default function WorkflowTable({
  workflows = [],
  isLoading = false,
  setOpenModal,
}: WorkflowTableProps) {
  const [rowSelection, setRowSelection] = React.useState({});
  const columnHelper = createColumnHelper<Workflow>();

  // Prepare data with default values for missing properties
  const preparedWorkflows = workflows.map((workflow) => ({
    ...workflow,
    actions: workflow.actions || [],
    triggers: workflow.triggers || [],
    schedules: workflow.schedules || 0,
  }));

  const columns = [
    columnHelper.display({
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-gray-600"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-gray-600"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
      size: 40,
    }),
    columnHelper.display({
      id: "logo",
      header: "LOGO",
      cell: () => {
        return (
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400">
            <User size={16} />
          </div>
        );
      },
      size: 80,
    }),
    columnHelper.accessor("name", {
      header: "Title",
      cell: (info) => {
        return (
          <div className="flex items-center gap-3">
            <span className="text-white">{info.getValue()}</span>
          </div>
        );
      },
      size: 250,
    }),
    columnHelper.accessor("description", {
      header: "Description",
      cell: (info) => {
        return (
          <div className="text-gray-400 truncate max-w-xs">
            {info.getValue()}
          </div>
        );
      },
      size: 250,
    }),
    columnHelper.accessor("actions", {
      header: "Options",
      cell: (info) => {
        const actions = info.getValue() || [];

        const MAX_VISIBLE_ICONS = 5;
        const visibleActions = actions.slice(0, MAX_VISIBLE_ICONS);
        const remainingCount = actions.length - MAX_VISIBLE_ICONS;

        if (actions.length === 0) {
          return <div className="text-gray-500">No actions</div>;
        }

        return (
          <div className="flex gap-4">
            <div className="flex items-center">
              <div className="flex -space-x-2">
                {visibleActions.map((action, index) => (
                  <div
                    key={`action-icon-${index}`}
                    className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center"
                  >
                    {action.large_image ? (
                      <Image
                        src={action.large_image}
                        alt={action.app_name || "Action"}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full border-2 border-[#131B2F]"
                      />
                    ) : (
                      <span className="text-xs text-white">
                        {(action.app_name || "A").charAt(0)}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {remainingCount > 0 && (
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#131B2F] -ml-2 text-white text-xs">
                  +{remainingCount}
                </div>
              )}
            </div>
          </div>
        );
      },
      size: 400,
    }),
    columnHelper.accessor("triggers", {
      header: "Triggers",
      cell: (info) => (
        <div className="flex items-center gap-2 text-orange-500">
          <FileText size={16} />
          <span className="text-sm">{(info.getValue() || []).length}</span>
        </div>
      ),
      size: 100,
    }),
    columnHelper.accessor("schedules", {
      header: "Schedules",
      cell: (info) => (
        <div className="flex items-center gap-2 text-purple-500">
          <Clock size={16} />
          <span className="text-sm">{info.getValue() || 0}</span>
        </div>
      ),
      size: 100,
    }),
    columnHelper.accessor("actions", {
      header: "Tags",
      cell: (info) => {
        const actions = info.getValue() || [];

        if (actions.length === 0) {
          return <div className="text-gray-500">No tags</div>;
        }

        return (
          <div className="flex flex-wrap gap-2">
            {actions.map((action, index) => (
              <div
                key={`action-tag-${index}`}
                className="px-2 py-1 rounded-full text-xs font-medium bg-white text-gray-800"
              >
                {action.app_name || "Action"}
              </div>
            ))}
          </div>
        );
      },
      size: 300,
    }),
    columnHelper.display({
      id: "actions",
      cell: () => (
        <button className="p-2 hover:bg-gray-700 rounded-lg">
          <Trash2 className="w-5 h-5 text-gray-400" />
        </button>
      ),
      size: 60,
    }),
  ];

  const table = useReactTable({
    data: preparedWorkflows,
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
      <div className="min-h-screen bg-[#131B2F] p-6">
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
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-white">ALL Workflows</h1>
          <button className="text-gray-400 hover:bg-gray-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
            Categories
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="bg-[#071026] border border-[#00F6FF] text-white px-4 py-2 rounded-lg flex items-center gap-2"
            onClick={() => setOpenModal(true)}
          >
            <Plus className="w-5 h-5" />
            Create workflow
          </button>
        </div>
      </div>
      <div className="bg-[#0A162E] rounded-lg border border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
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
              {table.getRowModel().rows.map((row) => (
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
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <select className="bg-[#071026] text-gray-400 border border-gray-700 rounded-lg px-2 py-1">
              <option>10</option>
              <option>25</option>
              <option>50</option>
            </select>
            <span className="text-gray-400">Items per page</span>
          </div>

          <div className="flex items-center gap-4 text-gray-400">
            <span>
              1 to {preparedWorkflows.length} of {preparedWorkflows.length}
            </span>
            <div className="flex gap-2">
              <button className="p-1 hover:bg-gray-700 rounded">←</button>
              <button className="p-1 hover:bg-gray-700 rounded">→</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
