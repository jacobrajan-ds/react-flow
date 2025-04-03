"use client";

import { useState } from "react";
import Link from "next/link";
import { Home, Zap, BarChart2, Users } from "lucide-react";

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div
      className={`bg-[#071026] h-screen ${
        isCollapsed ? "w-16" : "w-64"
      } transition-all duration-300 border-r border-gray-800 flex flex-col`}
    >
      {/* Logo */}
      <div className="p-4 flex items-center">
        <div className="bg-[#131B2F] p-2 rounded-lg">
          <Zap className="text-[#00F6FF]" size={24} />
        </div>
        {!isCollapsed && (
          <span className="ml-3 text-xl font-bold text-white">Playbook</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-8 flex-1">
        <ul>
          <li>
            <Link
              href="/dashboard"
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#0A162E] hover:text-white"
            >
              <Home size={20} />
              {!isCollapsed && <span className="ml-3">Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/workflows"
              className="flex items-center px-4 py-3 text-[#00F6FF] bg-[#0A162E] border-l-2 border-[#00F6FF]"
            >
              <Zap size={20} />
              {!isCollapsed && <span className="ml-3">Workflows</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/usage"
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#0A162E] hover:text-white"
            >
              <BarChart2 size={20} />
              {!isCollapsed && <span className="ml-3">Usage</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/members"
              className="flex items-center px-4 py-3 text-gray-300 hover:bg-[#0A162E] hover:text-white"
            >
              <Users size={20} />
              {!isCollapsed && <span className="ml-3">Members</span>}
            </Link>
          </li>
        </ul>
      </nav>

      {/* Collapse button */}
      <div className="p-4">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-full bg-[#0A162E] text-gray-400 hover:text-white"
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>
    </div>
  );
}
