import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, FileText, Filter, X } from "lucide-react";
import { useDocumentStore } from "@/store/useDocumentStore";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { STATUS_COLORS, TYPE_COLORS, DOCUMENT_TYPES, DOCUMENT_STATUSES } from "@/constants";
import { formatDate, cn } from "@/lib/utils";
import type { DocumentStatus, DocumentType } from "@/types";

export function SearchPage() {
  const navigate = useNavigate();
  const { documents } = useDocumentStore();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const results = !query && !typeFilter && !statusFilter ? [] : documents.filter((doc) => {
    const q = query.toLowerCase();
    const matchQ = !q || doc.title.toLowerCase().includes(q) || doc.documentNumber.toLowerCase().includes(q) || doc.authorName.toLowerCase().includes(q) || doc.tags.some((t) => t.toLowerCase().includes(q)) || doc.description.toLowerCase().includes(q);
    const matchType = !typeFilter || doc.documentType === typeFilter;
    const matchStatus = !statusFilter || doc.status === statusFilter;
    return matchQ && matchType && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-display">Advanced Search</h1>
        <p className="text-sm text-gray-500 mt-1">Search across all legislative records</p>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="search"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, number, author, or keyword..."
            className="w-full pl-12 pr-12 py-3.5 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-3 mt-4">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs text-gray-400 font-medium">Filter by type:</span>
          </div>
          {DOCUMENT_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? "" : t)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer",
                typeFilter === t ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-medium">Filter by status:</span>
          </div>
          {DOCUMENT_STATUSES.slice(0, 5).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? "" : s)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer",
                statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {(query || typeFilter || statusFilter) && (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            {results.length} result{results.length !== 1 ? "s" : ""} found
          </p>
          {results.length === 0 ? (
            <EmptyState
              title="No results found"
              description={`No documents match "${query}". Try a different keyword or broaden your search.`}
            />
          ) : (
            <div className="space-y-2">
              {results.map((doc) => {
                const sc = STATUS_COLORS[doc.status as DocumentStatus];
                const tc = TYPE_COLORS[doc.documentType as DocumentType];
                return (
                  <div
                    key={doc.id}
                    onClick={() => navigate(`/legislation/${doc.id}`)}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-blue-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", tc.bg)}>
                        <FileText className={cn("w-5 h-5", tc.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded font-semibold">{doc.documentNumber}</span>
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", tc.bg, tc.text)}>{doc.documentType}</span>
                          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", sc.bg, sc.text)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                            {doc.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 line-clamp-2">{doc.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{doc.authorName} · {doc.committee} · {formatDate(doc.sessionDate)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!query && !typeFilter && !statusFilter && (
        <div className="text-center py-12 text-gray-400">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Start typing to search across all legislative records</p>
        </div>
      )}
    </div>
  );
}