import React, { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import Link from "next/link";
import SidebarContent from "./Sidebaritems";

interface DropdownProps {
  item: any;
  isOpen: boolean;
  openDropdown: (id: string) => void;
  closeDropdown: (id: string) => void;
  currentPath: string;
}

const NavDropdown: React.FC<DropdownProps> = ({
  item,
  isOpen,
  openDropdown,
  closeDropdown,
  currentPath,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    openDropdown(item.id);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      closeDropdown(item.id);
    }, 300); // 300ms delay before closing
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative group"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button className="flex items-center px-4 py-2 text-white hover:bg-darkblue/50 rounded-md w-full">
        {item.icon && (
          <Icon
            icon={item.icon}
            className="mr-2 text-[5a6a85]"
            width={20}
            height={20}
          />
        )}
        <span className="flex-grow">{item.name}</span>
        <Icon
          icon={isOpen ? "tabler:chevron-up" : "tabler:chevron-down"}
          width={16}
          height={16}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1 w-48 bg-primary p-2 rounded-md shadow-lg !z-[9999999]">
          {item.children?.map((child: any) => (
            <Link
              href={child.url}
              key={child.id}
              className={`block px-4 py-3 text-sm text-white hover:bg-darkblue/70 ${
                currentPath === child.url ? "bg-darkblue/70" : ""
              }`}
            >
              {child.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const NavBar: React.FC = () => {
  const [openDropdown, setOpenDropdown] = useState<string>("");
  const [currentPath, setCurrentPath] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Set mounted flag and current path after component mounts
  useEffect(() => {
    setIsMounted(true);
    setCurrentPath(window.location.pathname);

    // Optional: Update path on route change
    const handleRouteChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  const openDropdownHandler = (id: string) => {
    setOpenDropdown(id);
  };

  const closeDropdownHandler = (id: string) => {
    setOpenDropdown("");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isMounted) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMounted]);

  // Don't render anything until mounted
  if (!isMounted) {
    return null; // or a loading indicator
  }

  return (
    <nav className="bg-[#131B2F] h-16 flex items-center px-4 border-t-primary border-t">
      <div ref={navRef} className="flex items-center w-auto ">
        {SidebarContent[0].children?.map((item) => (
          <React.Fragment key={item.id}>
            {item.children ? (
              <NavDropdown
                item={item}
                isOpen={openDropdown === item.id}
                openDropdown={openDropdownHandler}
                closeDropdown={closeDropdownHandler}
                currentPath={currentPath}
              />
            ) : (
              <Link
                href={item.external ? item.url : item.url || "#"}
                target={item.external ? "_blank" : "_self"}
                className={`flex items-center px-4 py-2 text-white hover:bg-darkblue/50 rounded-md ${
                  currentPath === item.url ? "bg-darkblue/70" : ""
                }`}
              >
                {item.icon && (
                  <Icon
                    icon={item.icon}
                    className="mr-2 text-[#5a6a85]"
                    width={20}
                    height={20}
                  />
                )}
                <span>{item.name}</span>
                {item.external && (
                  <Icon
                    icon="tabler:external-link"
                    className="ml-1"
                    width={16}
                    height={16}
                  />
                )}
              </Link>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default NavBar;
