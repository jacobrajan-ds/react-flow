"use client";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Spinner } from "flowbite-react";
import LoadingSpinner from "./shared/LoadingSpinner";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isPublicRoute =
    pathname === "/onboard" || pathname.startsWith("/onboard/");

  // if (isLoading && !searchParams.has("code")) {
  //   return (
  //     <div className="flex items-center justify-center min-h-screen bg-primary">
  //       <LoadingSpinner />
  //     </div>
  //   );
  // }

  if (isAuthenticated || isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary">
      <LoadingSpinner />
    </div>
  );
}
