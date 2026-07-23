import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Filter, Plus, Eye, ChevronLeft, ChevronRight,
  SlidersHorizontal, X, FileText, Download
} from "lucide-react";
import { useDocumentStore } from "@/store/useDocumentStore";
import {
  DOCUMENT_TYPES, DOCUMENT_STATUSES, COMMITTEE_TYPES,
  STATUS_COLORS, TYPE_COLORS, YEAR_OPTIONS, DEFAULT_PAGE_SIZE
} from "@/constants";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { formatDate, cn, truncate } from "@/lib/utils";
import type { DocumentType, DocumentStatus } from "@/types";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import type { LegislativeDocument } from "@/types";

const col = createColumnHelper<LegislativeDocument>();

export function RecordsPage() {
  const navigate = useNavigate();
  const { filters, setFilters, resetFilters, isLoading, getFilteredDocuments } = useDocumentStore();
  const [showFilters, setShowFilters] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);
  const pageSize = DEFAULT_PAGE_SIZE;

  const filtered = useMemo(() => getFilteredDocuments(), [getFilteredDocuments, filters]);
  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageData = filtered.slice((page - 1) * pageSize, page * pageSize);

  const activeFilterCount = [
    filters.documentType, filters.status, filters.committee, filters.year, filters.storageType
  ].filter(Boolean).length;

  const columns = useMemo(() => [
    col.accessor("documentNumber", {
      header: "Number",
      cell: (info) => (
        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded">
          {info.getValue()}
        </span>
      ),
      size: 130,
    }),
    col.accessor("documentType", {
      header: "Type",
      cell: (info) => {
        const type = info.getValue() as DocumentType;
        const c = TYPE_COLORS[type];
        return <Badge className={cn("text-xs", c.bg, c.text)}>{type}</Badge>;
      },
      size: 110,
    }),
    col.accessor("title", {
      header: "Title",
      cell: (info) => (
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate max-w-xs" title={info.getValue()}>
            {truncate(info.getValue(), 80)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{info.row.original.committee} Committee</p>
        </div>
      ),
    }),
    col.accessor("status", {
      header: "Status",
      cell: (info) => {
        const status = info.getValue() as DocumentStatus;
        const c = STATUS_COLORS[status];
        return (
          <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium", c.bg, c.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", c.dot)} />
            {status}
          </span>
        );
      },
      size: 140,
    }),
    col.accessor("authorName", {
      header: "Author",
      cell: (info) => <span className="text-sm text-gray-600">{info.getValue()}</span>,
      size: 160,
    }),
    col.accessor("sessionDate", {
      header: "Session Date",
      cell: (info) => <span className="text-sm text-gray-500">{formatDate(info.getValue())}</span>,
      size: 120,
    }),
    col.display({
      id: "actions",
      header: "",
      cell: (info) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/legislation/${info.row.original.id}`); }}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer"
          title="View document"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
      size: 50,
    }),
  ], [navigate]);

  const table = useReactTable({
    data: pageData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Records</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} document{filtered.length !== 1 ? "s" : ""} found</p>
        </div>
        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => navigate("/legislation/new")}>
          New Document
        </Button>
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Search by title, number, author, or tag..."
              value={filters.search}
              onChange={(e) => { setFilters({ search: e.target.value }); setPage(1); }}
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 placeholder-gray-400"
            />
            {filters.search && (
              <button
                onClick={() => setFilters({ search: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all cursor-pointer",
              showFilters || activeFilterCount > 0
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={() => { resetFilters(); setPage(1); }} className="text-sm text-red-500 hover:text-red-700 font-medium cursor-pointer">
              Clear all
            </button>
          )}
        </div>

        {/* Filter Row */}
        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2 border-t border-gray-100 animate-slide-up">
            {[
              {
                label: "Type", value: filters.documentType ?? "",
                onChange: (v: string) => { setFilters({ documentType: v as DocumentType || undefined }); setPage(1); },
                options: DOCUMENT_TYPES.map((t) => ({ value: t, label: t })),
                placeholder: "All Types",
              },
              {
                label: "Status", value: filters.status ?? "",
                onChange: (v: string) => { setFilters({ status: v as DocumentStatus || undefined }); setPage(1); },
                options: DOCUMENT_STATUSES.map((s) => ({ value: s, label: s })),
                placeholder: "All Statuses",
              },
              {
                label: "Committee", value: filters.committee ?? "",
                onChange: (v: string) => { setFilters({ committee: v as typeof filters.committee || undefined }); setPage(1); },
                options: COMMITTEE_TYPES.map((c) => ({ value: c, label: c })),
                placeholder: "All Committees",
              },
              {
                label: "Year", value: filters.year ? String(filters.year) : "",
                onChange: (v: string) => { setFilters({ year: v ? Number(v) : undefined }); setPage(1); },
                options: YEAR_OPTIONS.map((y) => ({ value: String(y), label: String(y) })),
                placeholder: "All Years",
              },
              {
                label: "Storage", value: filters.storageType ?? "",
                onChange: (v: string) => { setFilters({ storageType: v as typeof filters.storageType || undefined }); setPage(1); },
                options: [{ value: "Digital", label: "Digital" }, { value: "Paper", label: "Paper" }, { value: "Both", label: "Both" }],
                placeholder: "All Types",
              },
            ].map((f) => (
              <div key={f.label}>
                <label className="text-xs text-gray-500 font-medium block mb-1">{f.label}</label>
                <div className="relative">
                  <select
                    value={f.value}
                    onChange={(e) => f.onChange(e.target.value)}
                    className="w-full appearance-none text-sm border border-gray-200 rounded-lg px-3 py-2 pr-7 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{f.placeholder}</option>
                    {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <Filter className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={10} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No documents found"
            description="Try adjusting your search or filter criteria to find what you're looking for."
            action={<Button variant="outline" size="sm" onClick={() => { resetFilters(); setPage(1); }}>Clear Filters</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-gray-100 bg-gray-50/50">
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none"
                        style={{ width: header.getSize() }}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span className="flex items-center gap-1.5">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === "asc" && "↑"}
                          {header.column.getIsSorted() === "desc" && "↓"}
                        </span>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-50">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-gray-50/70 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/legislation/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
            <p className="text-xs text-gray-500">
              Showing {Math.min((page - 1) * pageSize + 1, filtered.length)}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} records
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer",
                      pg === page ? "bg-blue-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-white"
                    )}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {filtered.length > 0 && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>
        </div>
      )}
    </div>
  );
}