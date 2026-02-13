"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Warehouse,
  TruckIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  BarChart3,
  Settings,
  Archive,
  LogOut,
  DollarSign,
  ClipboardCheck,
  X,
} from "lucide-react";
import { translations } from "@/lib/translations/es";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(path + "/");

  const linkClass = (path: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
      isActive(path)
        ? "bg-primary-50 text-primary-700 font-medium"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">LATAM BOX</span>
            </Link>
            <button onClick={onClose} className="lg:hidden p-1">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {/* Dashboard */}
            <Link
              href="/dashboard"
              className={linkClass("/dashboard")}
              onClick={onClose}
            >
              <LayoutDashboard className="w-5 h-5" />
              {translations.navigation.dashboard}
            </Link>

            {/* Inventory - All roles */}
            <Link
              href="/dashboard/containers"
              className={linkClass("/dashboard/containers")}
              onClick={onClose}
            >
              <Package className="w-5 h-5" />
              {translations.navigation.inventory}
            </Link>

            {/* Register Containers - Admin only */}
            {role === "ADMIN" && (
              <Link
                href="/dashboard/containers/register"
                className={linkClass("/dashboard/containers/register")}
                onClick={onClose}
              >
                <PlusCircle className="w-5 h-5" />
                {translations.navigation.registerContainers}
              </Link>
            )}

            {/* Warehouse section */}
            {(role === "ADMIN" || role === "WAREHOUSE_COORDINATOR") && (
              <>
                <div className="pt-4 pb-1">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {translations.navigation.warehouse}
                  </p>
                </div>
                <Link
                  href="/dashboard/warehouse/receive"
                  className={linkClass("/dashboard/warehouse/receive")}
                  onClick={onClose}
                >
                  <ArrowDownToLine className="w-5 h-5" />
                  {translations.navigation.receive}
                </Link>
                <Link
                  href="/dashboard/warehouse/exits"
                  className={linkClass("/dashboard/warehouse/exits")}
                  onClick={onClose}
                >
                  <ArrowUpFromLine className="w-5 h-5" />
                  {translations.navigation.exits}
                </Link>
                <Link
                  href="/dashboard/warehouse/in-transit"
                  className={linkClass("/dashboard/warehouse/in-transit")}
                  onClick={onClose}
                >
                  <TruckIcon className="w-5 h-5" />
                  {translations.navigation.inTransit}
                </Link>
              </>
            )}

            {/* Sales section */}
            {(role === "ADMIN" || role === "SALES") && (
              <>
                <div className="pt-4 pb-1">
                  <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {translations.navigation.sales}
                  </p>
                </div>
                <Link
                  href="/dashboard/sales/assign"
                  className={linkClass("/dashboard/sales/assign")}
                  onClick={onClose}
                >
                  <ClipboardCheck className="w-5 h-5" />
                  {translations.navigation.assign}
                </Link>
                <Link
                  href="/dashboard/sales/pending-confirmations"
                  className={linkClass(
                    "/dashboard/sales/pending-confirmations"
                  )}
                  onClick={onClose}
                >
                  <DollarSign className="w-5 h-5" />
                  {translations.navigation.pendingRevenue}
                </Link>
              </>
            )}

            {/* Clients */}
            {(role === "ADMIN" || role === "SALES") && (
              <Link
                href="/dashboard/clients"
                className={linkClass("/dashboard/clients")}
                onClick={onClose}
              >
                <Users className="w-5 h-5" />
                {translations.navigation.clients}
              </Link>
            )}

            {/* Analytics - Admin only */}
            {role === "ADMIN" && (
              <Link
                href="/dashboard/admin"
                className={linkClass("/dashboard/admin")}
                onClick={onClose}
              >
                <BarChart3 className="w-5 h-5" />
                {translations.navigation.analytics}
              </Link>
            )}

            {/* Archive - Admin only */}
            {role === "ADMIN" && (
              <Link
                href="/dashboard/containers/archive"
                className={linkClass("/dashboard/containers/archive")}
                onClick={onClose}
              >
                <Archive className="w-5 h-5" />
                {translations.navigation.archive}
              </Link>
            )}

            {/* Settings - Admin only */}
            {role === "ADMIN" && (
              <Link
                href="/dashboard/settings"
                className={linkClass("/dashboard/settings")}
                onClick={onClose}
              >
                <Settings className="w-5 h-5" />
                {translations.navigation.settings}
              </Link>
            )}
          </nav>

          {/* User info + logout */}
          <div className="border-t border-gray-200 px-3 py-4">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {session?.user?.name?.charAt(0) || "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {role
                    ? translations.settings.roles[role] || role
                    : ""}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 w-full mt-1"
            >
              <LogOut className="w-5 h-5" />
              {translations.auth.logout}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
