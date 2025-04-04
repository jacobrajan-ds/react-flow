import React from "react";
import {
  Folder,
  BookOpen,
  FileCode,
  ChevronRight,
  Layers,
  GitBranch,
  Box,
} from "lucide-react";

interface WorkflowCardProps {
  workflow?: any;
  isLoading?: boolean;
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="bg-[#071026] border border-[#00F6FF]/30 rounded-xl p-5 w-[280px] h-[180px] animate-pulse shadow-lg shadow-[#00F6FF]/5">
        <div className="flex justify-between items-center mb-4">
          <div className="h-8 w-8 bg-[#0A162E] rounded-md"></div>
          <div className="h-5 w-16 bg-[#0A162E] rounded-full"></div>
        </div>
        <div className="h-5 bg-[#0A162E] rounded w-3/4 mb-3"></div>
        <div className="h-4 bg-[#0A162E] rounded w-full mb-2"></div>
        <div className="h-4 bg-[#0A162E] rounded w-2/3 mb-4"></div>
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-[#0A162E] rounded"></div>
          <div className="h-4 w-20 bg-[#0A162E] rounded"></div>
        </div>
      </div>
    );
  }

  // Determine the icon based on item type
  let icon;
  let bgColor = "bg-gradient-to-br";
  let gradientColors = "";

  if (workflow?.type === "collection") {
    icon = <Folder className="text-white" size={20} />;
    gradientColors = "from-blue-400 to-cyan-500";
  } else if (workflow?.type === "playbook") {
    icon = <BookOpen className="text-white" size={20} />;
    gradientColors = "from-indigo-400 to-purple-500";
  } else if (workflow?.type === "playbookVersion") {
    icon = <FileCode className="text-white" size={20} />;
    gradientColors = "from-emerald-400 to-teal-500";
  }

  // Count items within each type
  const collectionCount = workflow?.collection?.length || 0;
  const playbookCount = workflow?.playbook?.length || 0;
  const versionCount = workflow?.playbook_version?.length || 0;
  const totalItemCount = collectionCount + playbookCount;

  // Format date for display: 2025-04-04 to Apr 4, 2025
  const formattedDate = workflow?.created_at
    ? new Date(workflow.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Apr 4, 2025";

  return (
    <div className="bg-[#071026] border border-[#00F6FF]/30 hover:border-[#00F6FF] rounded-xl p-5 w-[280px] h-[180px] flex flex-col cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-[#00F6FF]/20 group relative overflow-hidden">
      {/* Subtle glow effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#00F6FF]/0 to-[#00F6FF]/0 group-hover:from-[#00F6FF]/5 group-hover:to-[#00F6FF]/10 transition-all duration-500"></div>

      <div className="flex justify-between items-center mb-3">
        <div
          className={`${bgColor} ${gradientColors} rounded-md p-2 w-8 h-8 flex items-center justify-center shadow-md`}
        >
          {icon}
        </div>

        <div className="flex items-center">
          {workflow?.type === "collection" && totalItemCount > 0 && (
            <span className="text-xs font-medium bg-[#0A162E] text-[#00F6FF] px-2 py-1 rounded-full mr-1">
              {totalItemCount} {totalItemCount === 1 ? "item" : "items"}
            </span>
          )}
          {workflow?.type === "playbook" && versionCount > 0 && (
            <span className="text-xs font-medium bg-[#0A162E] text-[#00F6FF] px-2 py-1 rounded-full mr-1">
              {versionCount} {versionCount === 1 ? "version" : "versions"}
            </span>
          )}
          <ChevronRight
            size={16}
            className="text-gray-400 group-hover:text-white transition-colors duration-300"
          />
        </div>
      </div>

      <h3 className="font-semibold text-lg text-white mb-1 group-hover:text-[#00F6FF] transition-colors duration-300">
        {workflow?.name}
      </h3>
      <p className="text-gray-400 text-sm line-clamp-2 mb-auto">
        {workflow?.description || "No description provided"}
      </p>

      {/* Status badges for playbook versions */}
      {workflow?.type === "playbookVersion" &&
        workflow?.version_info?.is_latest && (
          <div className="absolute top-3 right-3 bg-[#00F6FF] text-[#071026] text-xs px-2 py-0.5 rounded-full font-medium">
            Latest
          </div>
        )}

      {/* Content summary footer - replacing calendar and user info */}
      <div className="flex justify-between items-center mt-4 text-xs pt-2 border-t border-gray-800">
        {/* For collections: show breakdown of contained items */}
        {workflow?.type === "collection" && (
          <>
            {collectionCount > 0 && (
              <div className="flex items-center text-blue-400">
                <Folder size={14} className="mr-1" />
                <span>
                  {collectionCount} Collection{collectionCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {playbookCount > 0 && (
              <div className="flex items-center text-purple-400">
                <BookOpen size={14} className="mr-1" />
                <span>
                  {playbookCount} Playbook{playbookCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
            {!collectionCount && !playbookCount && (
              <div className="flex items-center text-gray-500">
                <Box size={14} className="mr-1" />
                <span>Empty collection</span>
              </div>
            )}
          </>
        )}

        {/* For playbooks: show version info */}
        {workflow?.type === "playbook" && (
          <>
            {versionCount > 0 ? (
              <div className="flex items-center text-teal-400">
                <GitBranch size={14} className="mr-1" />
                <span>
                  {versionCount} Version{versionCount !== 1 ? "s" : ""}
                </span>
              </div>
            ) : (
              <div className="flex items-center text-gray-500">
                <GitBranch size={14} className="mr-1" />
                <span>No versions</span>
              </div>
            )}
            {/* Show execution mode if available */}
            {workflow.playbook_version &&
              workflow.playbook_version[0]?.execution_mode && (
                <div className="flex items-center text-gray-400">
                  <FileCode size={14} className="mr-1" />
                  <span>
                    {workflow.playbook_version[0].execution_mode} Mode
                  </span>
                </div>
              )}
          </>
        )}

        {/* For playbook versions: show version number and mode */}
        {workflow?.type === "playbookVersion" && workflow?.version_info && (
          <>
            <div className="flex items-center text-teal-400">
              <GitBranch size={14} className="mr-1" />
              <span>Version {workflow.version_info.version_number}</span>
            </div>
            <div className="flex items-center text-gray-400">
              <FileCode size={14} className="mr-1" />
              <span>{workflow.version_info.execution_mode}</span>
            </div>
          </>
        )}
      </div>

      {/* Show contents preview for collections */}
      {workflow?.type === "collection" &&
        (collectionCount > 0 || playbookCount > 0) && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#071026] to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs pt-10">
            <div className="flex flex-wrap gap-1">
              {/* Collection items previews */}
              {workflow.collection &&
                workflow.collection
                  .slice(0, 2)
                  .map((col: any, index: number) => (
                    <div
                      key={`col-${index}`}
                      className="bg-[#0A162E] px-2 py-1 rounded flex items-center"
                    >
                      <Folder size={12} className="text-blue-400 mr-1" />
                      <span className="text-gray-300 truncate max-w-[80px]">
                        {col.name}
                      </span>
                    </div>
                  ))}

              {/* Playbook items previews */}
              {workflow.playbook &&
                workflow.playbook.slice(0, 2).map((pb: any, index: number) => (
                  <div
                    key={`pb-${index}`}
                    className="bg-[#0A162E] px-2 py-1 rounded flex items-center"
                  >
                    <BookOpen size={12} className="text-purple-400 mr-1" />
                    <span className="text-gray-300 truncate max-w-[80px]">
                      {pb.name}
                    </span>
                  </div>
                ))}

              {/* Show count of additional items if there are more */}
              {totalItemCount > 4 && (
                <div className="bg-[#0A162E] px-2 py-1 rounded">
                  <span className="text-gray-400">
                    +{totalItemCount - 4} more
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Show version info for playbooks */}
      {workflow?.type === "playbook" && versionCount > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#071026] to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-xs pt-10">
          <div className="flex flex-wrap gap-1">
            {workflow.playbook_version &&
              workflow.playbook_version
                .slice(0, 3)
                .map((version: any, index: number) => (
                  <div
                    key={`ver-${index}`}
                    className="bg-[#0A162E] px-2 py-1 rounded flex items-center"
                  >
                    <FileCode size={12} className="text-teal-400 mr-1" />
                    <span className="text-gray-300">
                      v{version.version_number}
                    </span>
                    {version.is_latest && (
                      <span className="ml-1 text-[#00F6FF]">• latest</span>
                    )}
                  </div>
                ))}

            {versionCount > 3 && (
              <div className="bg-[#0A162E] px-2 py-1 rounded">
                <span className="text-gray-400">+{versionCount - 3} more</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowCard;
