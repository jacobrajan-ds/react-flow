import React from "react";
import { Clock, FileText, Plus } from "lucide-react";
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

interface WorkflowCardProps {
  workflow?: Workflow;
  isLoading?: boolean;
}

export default function WorkflowCard({
  workflow,
  isLoading = false,
}: WorkflowCardProps) {
  if (isLoading) {
    return (
      <div className="bg-[#0A162E] rounded-lg p-6 w-72 border border-gray-800 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-4 bg-gray-800 w-1/2 rounded"></div>
          <div className="h-4 bg-gray-800 w-8 rounded"></div>
        </div>
        <div className="h-4 bg-gray-800 w-full rounded mb-6"></div>
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="h-4 bg-gray-800 w-20 rounded-full"></div>
          <div className="h-4 bg-gray-800 w-24 rounded-full"></div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 bg-gray-800 rounded-full"></div>
              <div className="h-8 w-8 bg-gray-800 rounded-full"></div>
            </div>
            <div className="w-8 h-8 bg-gray-800 rounded-full border border-dashed border-gray-700 ml-2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!workflow) return null;

  // Default values for optional properties
  const {
    name,
    description,
    actions = [],
    triggers = [],
    schedules = 0,
  } = workflow;

  const MAX_VISIBLE_ICONS = 5;
  const visibleActions = actions.slice(0, MAX_VISIBLE_ICONS);
  const remainingCount = actions.length - MAX_VISIBLE_ICONS;

  return (
    <div className="bg-[#0A162E] rounded-lg p-6 w-72 cursor-pointer hover:bg-[#131B2F] transition-colors border border-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-md font-medium">{name}</h3>
        <button className="text-gray-400 hover:text-gray-300">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
            />
          </svg>
        </button>
      </div>

      {/* Description */}
      <p className="text-gray-400 text-xs mb-4 line-clamp-2">{description}</p>

      {/* Action Tags - Only render if actions exist */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {actions.map((action, index) => (
            <div
              key={`action-tag-${index}`}
              className="px-2 py-1 rounded-full text-xs font-medium bg-white text-gray-800"
            >
              {action.app_name || "Action"}
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        {/* Action Icons and Add Button */}
        <div className="flex items-center">
          {actions.length > 0 ? (
            <>
              <div className="flex -space-x-2">
                {visibleActions.map((action, index) => (
                  <div
                    key={`action-icon-${index}`}
                    className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#0A162E]"
                  >
                    {action.large_image ? (
                      <Image
                        src={action.large_image}
                        alt={action.app_name || "Action"}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full"
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
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#0A162E] -ml-2 text-white text-xs">
                  +{remainingCount}
                </div>
              )}
            </>
          ) : (
            <div className="text-gray-500 text-xs">No actions</div>
          )}

          <button className="w-8 h-8 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center ml-2 text-gray-400 hover:text-gray-300 hover:border-gray-500">
            <Plus size={16} />
          </button>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4">
          {triggers?.length > 0 && (
            <div className="flex items-center gap-2 text-orange-500">
              <FileText size={16} />
              <span className="text-sm">{triggers.length}</span>
            </div>
          )}
          {schedules > 0 && (
            <div className="flex items-center gap-2 text-purple-500">
              <Clock size={16} />
              <span className="text-sm">{schedules}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
