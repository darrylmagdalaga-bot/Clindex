import { useNavigate } from "react-router-dom";
import { Archive, FileText, Search } from "lucide-react";
import { useDocumentStore } from "@/store/useDocumentStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { STATUS_COLORS, TYPE_COLORS, YEAR_OPTIONS } from "@/constants";
import { formatDate, cn } from "@/lib/utils";
import { useState } from "react";
import type { DocumentStatus, DocumentType } from "@/types";

export function ArchivePage() {
  const navigate = useNavigate();
  const { documents } = useDocumentStore();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const archived = documents.filter((d) => d.status === "Archived" || (selectedYear && d.year === selectedYear));
  const byYear = YEAR_OPTIONS.filter((y) => documents.some((d) => d.year === y));

  const display = selectedYear
    ? documents.filter((d) => d.year === selectedYear)
    : documents.filter((d) => d.status === "Archived");

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Archive</h1>
          <p className="text-sm text-gray-500 mt-1">Browse historical legislative records by year</p>
        </div>
        <Button variant="outline" size="sm" icon={<Search className="w-4 h-4" />} onClick={() => navigate("/search")}>
          Search Archive
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Year Browser */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Browse by Year</p>
          {byYear.map((yr) => {
            const count = documents.filter((d) => d.year === yr).length;
            return (
              <button
                key={yr}
                onClick={() => setSelectedYear(selectedYear === yr ? null : yr)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                  selectedYear === yr ? "bg-blue-600 text-white" : "bg-white border border-gray-100 text-gray-700 hover:bg-gray-50"
                )}
              >
                <span>{yr}</span>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs font-semibold",
                  selectedYear === yr ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                )}>{count}</span>
              </button>
            );
          })}
          <button
            onClick={() => setSelectedYear(null)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer mt-2",
              !selectedYear ? "bg-slate-800 text-white" : "bg-white border border-gray-100 text-gray-700 hover:bg-gray-50"
            )}
          >
            <span className="flex items-center gap-2"><Archive className="w-3.5 h-3.5" /> Archived</span>
            <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", !selectedYear ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600")}>
              {documents.filter((d) => d.status === "Archived").length}
            </span>
          </button>
        </div>

        {/* Document List */}
        <div className="lg:col-span-3">
          <Card padding="none" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
              <p className="text-sm font-semibold text-gray-700">
                {selectedYear ? `${selectedYear} Legislative Records` : "Archived Documents"} · {display.length} documents
              </p>
            </div>
            {display.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Archive className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">No records found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {display.map((doc) => {
                  const sc = STATUS_COLORS[doc.status as DocumentStatus];
                  const tc = TYPE_COLORS[doc.documentType as DocumentType];
                  return (
                    <div
                      key={doc.id}
                      onClick={() => navigate(`/legislation/${doc.id}`)}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", tc.bg)}>
                        <FileText className={cn("w-4 h-4", tc.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{doc.documentNumber} · {formatDate(doc.sessionDate)}</p>
                      </div>
                      <span className={cn("flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium", tc.bg, tc.text)}>
                        {doc.documentType}
                      </span>
                      <span className={cn("flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", sc.bg, sc.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                        {doc.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}