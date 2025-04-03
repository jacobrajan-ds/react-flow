export interface ChildItem {
  id?: number | string;
  name?: string;
  icon?: any;
  children?: ChildItem[];
  item?: any;
  url?: any;
  color?: string;
  disabled?: boolean;
  subtitle?: string;
  badge?: boolean;
  badgeType?: string;
  external?: boolean;
}

export interface MenuItem {
  heading?: string;
  name?: string;
  icon?: any;
  id?: number;
  to?: string;
  items?: MenuItem[];
  children?: ChildItem[];
  url?: any;
  disabled?: boolean;
  subtitle?: string;
  badgeType?: string;
  badge?: boolean;
  external?: boolean;
}

import { uniqueId } from "lodash";

const SidebarContent: MenuItem[] = [
  {
    children: [
      {
        name: "Incident Summary",
        icon: "tabler:aperture",
        id: uniqueId(),
        url: "/",
      },

      {
        name: "Cyber Threats",
        id: uniqueId(),
        icon: "tabler:app-window",
        children: [
          {
            id: uniqueId(),
            name: "Alerts",
            url: "/alert",
          },
          {
            id: uniqueId(),
            name: "Vulnerability",
            url: "/vulnerability",
          },
          {
            id: uniqueId(),
            name: "Task Console",
            url: "/task",
          },
        ],
      },

      {
        name: "User Management",
        icon: "tabler:aperture",
        id: uniqueId(),
        url: "/user-management",
      },
      {
        name: "Connectors",
        icon: "tabler:aperture",
        id: uniqueId(),
        url: "https://10.6.0.11:3001/",
        external: false,
      },
      {
        name: "AI Agent",
        icon: "tabler:aperture",
        id: uniqueId(),
        url: "/AI-agent",
      },
      {
        name: "Playbook",
        icon: "tabler:aperture",
        id: uniqueId(),
        url: "/playbook",
      },
      {
        name: "Audit Logs",
        icon: "tabler:aperture",
        id: uniqueId(),
        url: "/audit",
      },
      {
        name: "Settings",
        id: uniqueId(),
        icon: "tabler:app-window",
        children: [
          // {
          //   id: uniqueId(),
          //   name: "User Management",
          //   url: "/user-management",
          // },
          {
            id: uniqueId(),
            name: "Tenant Management",
            url: "/tenant",
          },
        ],
      },
    ],
  },
];

export default SidebarContent;
