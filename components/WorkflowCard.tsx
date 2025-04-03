import React, { useState } from "react";
import {
  Clock,
  FileText,
  Plus,
  Folder,
  FolderOpen,
  Play,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";

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
  actions?: { app_name?: string; large_image?: string }[];
  triggers?: { id: string; name: string }[];
  schedules?: number;
}

interface BreadcrumbItem {
  id: string;
  name: string;
}

interface WorkflowCardProps {
  workflow?: Collection | Playbook;
  isLoading?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: (id: string) => void;
  onPlaybookClick?: (id: string) => void;
  level?: number;
}

export default function WorkflowCard({
  workflow,
  isLoading = false,
  isExpanded = false,
  onToggleExpand,
  onPlaybookClick,
  level = 0,
}: WorkflowCardProps) {
  const [childrenVisible, setChildrenVisible] = useState(isExpanded);

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

  // Check if this is a playbook by looking for collection_id property
  const isPlaybook = "collection_id" in workflow;

  // Default values for optional properties
  const { id, name, description } = workflow;

  // Get actions, triggers, schedules (only if they exist)
  const actions = workflow.actions || [];
  const triggers = workflow.triggers || [];
  const schedules = isPlaybook ? (workflow as any).schedules || 0 : 0;

  // For collections: count child items
  let childCollections: Collection[] = [];
  let childPlaybooks: Playbook[] = [];

  if (!isPlaybook) {
    const collection = workflow as Collection;
    childCollections = collection.collection || [];
    childPlaybooks = collection.playbook || [];
  }

  const MAX_VISIBLE_ICONS = 3;
  const visibleActions = actions.slice(0, MAX_VISIBLE_ICONS);
  const remainingCount = actions.length - MAX_VISIBLE_ICONS;

  const handleToggleExpand = () => {
    if (isPlaybook) {
      onPlaybookClick && onPlaybookClick(id);
      return;
    }

    setChildrenVisible(!childrenVisible);
    onToggleExpand && onToggleExpand(id);
  };

  const handlePlaybookClick = (playbookId: string) => {
    onPlaybookClick && onPlaybookClick(playbookId);
  };

  // Calculate margin for nested collections
  const leftMargin = level * 16;

  return (
    <div className="mb-2">
      <div
        className={`bg-[#0A162E] rounded-lg p-5 cursor-pointer hover:bg-[#131B2F] transition-colors border border-gray-800 ${
          childrenVisible ? "border-b-0 rounded-b-none" : ""
        }`}
        style={{ marginLeft: `${leftMargin}px` }}
        onClick={handleToggleExpand}
      >
        {/* Header with type icon and expand control */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {!isPlaybook &&
            (childCollections.length > 0 || childPlaybooks.length > 0) ? (
              <button
                className="text-gray-400 hover:text-white mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  setChildrenVisible(!childrenVisible);
                  onToggleExpand && onToggleExpand(id);
                }}
              >
                {childrenVisible ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            ) : (
              <div className="w-4 mr-1"></div>
            )}

            {isPlaybook ? (
              <Play size={18} className="text-green-500" />
            ) : childrenVisible ? (
              <FolderOpen size={18} className="text-yellow-500" />
            ) : (
              <Folder size={18} className="text-yellow-500" />
            )}
            <h3 className="text-white text-md font-medium">{name}</h3>
          </div>
          <button
            className="text-gray-400 hover:text-gray-300"
            onClick={(e) => e.stopPropagation()}
          >
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
        <p className="text-gray-400 text-xs mb-3 line-clamp-2">{description}</p>

        {/* Type badge */}
        <div className="flex flex-wrap gap-2 mb-3">
          <div
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              isPlaybook
                ? "bg-[#2C5282] text-[#BEE3F8]"
                : "bg-[#2D3748] text-[#CBD5E0]"
            }`}
          >
            {isPlaybook ? "Playbook" : "Collection"}
          </div>

          {/* For collections, show child counts */}
          {!isPlaybook &&
            (childCollections.length > 0 || childPlaybooks.length > 0) && (
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-[#1A2E4A] text-gray-300">
                {childCollections.length + childPlaybooks.length} item
                {childCollections.length + childPlaybooks.length !== 1
                  ? "s"
                  : ""}
              </div>
            )}
        </div>

        {/* Footer content */}
        <div className="flex items-center justify-between">
          {isPlaybook ? (
            /* Playbook Footer - Actions and status */
            <div className="flex items-center">
              {actions.length > 0 ? (
                <>
                  <div className="flex -space-x-2">
                    {visibleActions.map((action, index) => (
                      <div
                        key={`action-icon-${index}`}
                        className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#0A162E]"
                      >
                        {action.large_image ? (
                          <Image
                            src={action.large_image}
                            alt={action.app_name || "Action"}
                            width={28}
                            height={28}
                            className="w-7 h-7 rounded-full"
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
                    <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#0A162E] -ml-2 text-white text-xs">
                      +{remainingCount}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-gray-500 text-xs">No actions</div>
              )}
            </div>
          ) : (
            /* Collection Footer - Item counts */
            <div className="flex items-center text-gray-400 text-sm">
              {childCollections.length > 0 && (
                <span>
                  {childCollections.length} Folder
                  {childCollections.length !== 1 ? "s" : ""}
                </span>
              )}
              {childCollections.length > 0 && childPlaybooks.length > 0 && (
                <span className="mx-1">•</span>
              )}
              {childPlaybooks.length > 0 && (
                <span>
                  {childPlaybooks.length} Playbook
                  {childPlaybooks.length !== 1 ? "s" : ""}
                </span>
              )}
              {childCollections.length === 0 && childPlaybooks.length === 0 && (
                <span>Empty collection</span>
              )}
            </div>
          )}

          {/* Status Indicators for playbooks */}
          {isPlaybook && (
            <div className="flex items-center gap-4">
              {triggers?.length > 0 && (
                <div className="flex items-center gap-1 text-orange-500">
                  <FileText size={14} />
                  <span className="text-xs">{triggers.length}</span>
                </div>
              )}
              {schedules > 0 && (
                <div className="flex items-center gap-1 text-purple-500">
                  <Clock size={14} />
                  <span className="text-xs">{schedules}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Child collections and playbooks (if expanded) */}
      {!isPlaybook && childrenVisible && (
        <div className="pl-4 border-l border-r border-b border-gray-800 rounded-b-lg bg-[#0F1A2E] mb-4">
          {/* Child collections */}
          {childCollections.map((collection) => (
            <WorkflowCard
              key={`collection-${collection.id}`}
              workflow={collection}
              onToggleExpand={onToggleExpand}
              onPlaybookClick={onPlaybookClick}
              level={level + 1}
            />
          ))}

          {/* Child playbooks */}
          {childPlaybooks.map((playbook) => (
            <WorkflowCard
              key={`playbook-${playbook.id}`}
              workflow={playbook}
              onPlaybookClick={onPlaybookClick}
              level={level + 1}
            />
          ))}

          {/* Empty state */}
          {childCollections.length === 0 && childPlaybooks.length === 0 && (
            <div className="py-4 text-center text-gray-500 text-sm">
              This collection is empty
            </div>
          )}
        </div>
      )}
    </div>
  );
}
