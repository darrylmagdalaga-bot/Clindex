import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Search, Bell, Plus, Command, ChevronDown, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/useUIStore";
import { useDocumentStore } from "@/store/useDocumentStore";

export function Header() {
  const { toggleMobileSidebar, toggleSidebar } = useUIStore();
  const { setFilters } = useDocumentStore();
  const navigate = useNavigate();
  const [searchVal, setSearchVal] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ search: searchVal });
    navigate("/records");
  };

  return (
    <header className="h-[72px] bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 gap-6 flex-shrink-0 z-30 sticky top-0 shadow-sm">
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
        <button
           onClick={toggleMobileSidebar}
           className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
           aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation - Simple */}
        <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 font-medium whitespace-nowrap">
          <span>Overview</span>
        </div>

        {/* Global Search */}
        <form
          onSubmit={handleSearch}
          className={cn(
            "flex items-center gap-2 max-w-lg w-full border rounded-[12px] px-3.5 py-2.5 transition-all duration-200 ml-4",
            focused ? "border-[#3B82F6] bg-white shadow-[0_0_0_4px_rgba(59,130,246,0.1)]" : "border-gray-200 bg-gray-50/80 hover:bg-gray-100/50"
          )}
        >
          <Search className={cn("w-4.5 h-4.5 flex-shrink-0 transition-colors", focused ? "text-[#3B82F6]" : "text-gray-400")} />
          <input
            type="search"
            placeholder="Search documents, ordinances..."
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 text-gray-900 min-w-0"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          <kbd className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200 shadow-sm">
            <Command className="w-3 h-3" />K
          </kbd>
        </form>

        <div className="hidden md:flex ml-2">
            <button
               onClick={() => navigate("/legislation/new")}
               className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white text-sm font-medium rounded-[12px] hover:brightness-110 active:brightness-95 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] border border-[#2563EB]/50 cursor-pointer"
            >
               <Plus className="w-4 h-4" /> Quick Add <ChevronDown className="w-4 h-4 opacity-70 ml-1" />
            </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <button
          className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full ring-2 ring-white">3</span>
        </button>

        <button className="hidden sm:flex p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer">
            <Calendar className="w-5 h-5" />
        </button>
        
        <div className="h-8 w-[1px] bg-gray-200 hidden sm:block mx-1"></div>

        <div className="flex items-center gap-3 cursor-pointer group">
           <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold relative">
              AS
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
           </div>
           <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex items-center gap-1">Admin Staff <ChevronDown className="w-3.5 h-3.5 text-gray-400"/></p>
           </div>
        </div>

        <button
          className="md:hidden p-2 rounded-[12px] bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white hover:brightness-110 transition-all cursor-pointer shadow-sm"
          onClick={() => navigate("/legislation/new")}
          aria-label="New Document"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}