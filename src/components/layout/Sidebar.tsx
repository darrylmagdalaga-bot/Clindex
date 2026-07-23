import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, FileText, Search, BarChart3, Archive,
  Settings, HelpCircle, BookOpen, X, Scale, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import { APP_NAME } from "@/constants";

const navItems = [
  { label: "Dashboard",    href: "/",             icon: LayoutDashboard },
  { label: "Legislation",  href: "/legislation",  icon: Scale },
  { label: "Records",      href: "/records",      icon: FileText },
  { label: "Search",       href: "/search",       icon: Search },
  { label: "Reports",      href: "/reports",      icon: BarChart3 },
  { label: "Archive",      href: "/archive",      icon: Archive },
];
const secondaryItems = [
  { label: "Settings",     href: "/settings",     icon: Settings },
  { label: "Help & Support",href: "/help",        icon: HelpCircle },
];

export function Sidebar() {
  const { sidebarCollapsed, sidebarMobileOpen, closeMobileSidebar } = useUIStore();
  const location = useLocation();

  const NavItem = ({ item }: { item: typeof navItems[0] }) => {
    const isActive = item.href === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <NavLink
        to={item.href}
        onClick={closeMobileSidebar}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-sm font-medium transition-all duration-150 group relative",
          isActive
            ? "bg-[#2563EB] text-white shadow-sm"
            : "text-slate-400 hover:bg-[#1E293B] hover:text-slate-100"
        )}
        title={sidebarCollapsed ? item.label : undefined}
      >
        <Icon className={cn("flex-shrink-0", sidebarCollapsed ? "w-5 h-5" : "w-4.5 h-4.5")} />
        {!sidebarCollapsed && <span>{item.label}</span>}
      </NavLink>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0F172A]">
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-6 h-[72px] flex-shrink-0",
        sidebarCollapsed ? "justify-center px-0" : "justify-start"
      )}>
        <div className="w-8 h-8 rounded-[12px] bg-gradient-to-b from-[#3B82F6] to-[#2563EB] flex items-center justify-center flex-shrink-0 shadow-[0_2px_4px_rgba(0,0,0,0.1)]">
          <BookOpen className="w-4.5 h-4.5 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <div className="text-white font-bold text-base font-display truncate leading-tight tracking-wide">{APP_NAME}</div>
            <div className="text-slate-400 text-[11px] uppercase tracking-wider truncate">Legislative Records</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-4 space-y-1">
        {navItems.map((item) => <NavItem key={item.href} item={item} />)}
      </nav>

      {/* Secondary & User */}
      <div className="py-2 px-4 space-y-1 pb-4">
        {secondaryItems.map((item) => <NavItem key={item.href} item={item} />)}
        
        {!sidebarCollapsed && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between px-3 py-2.5 rounded-[12px] hover:bg-[#1E293B] cursor-pointer transition-colors bg-[#0B1120]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  AS
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-200 truncate leading-tight">Admin Staff</div>
                  <div className="text-[11px] text-slate-500 truncate">Legislative Office</div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside
        className={cn(
          "hidden lg:flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-[72px]" : "w-[260px]" // Slightly wider
        )}
      >
        <SidebarContent />
      </aside>

      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeMobileSidebar}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-300 ease-in-out lg:hidden",
          sidebarMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-6 h-[72px] bg-[#0F172A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[12px] bg-gradient-to-b from-[#3B82F6] to-[#2563EB] flex items-center justify-center shadow-lg">
              <BookOpen className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="text-white font-bold text-base font-display">{APP_NAME}</div>
               <div className="text-slate-400 text-[11px] uppercase tracking-wider truncate">Legislative Records</div>
            </div>
          </div>
          <button
            onClick={closeMobileSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 bg-[#0F172A]">
          <SidebarContent />
        </div>
      </aside>
    </>
  );
}