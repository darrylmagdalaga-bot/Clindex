import { useNavigate } from "react-router-dom";
import { Plus, FileText, Scale, ArrowUpRight } from "lucide-react";
import { useDocumentStore } from "@/store/useDocumentStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { STATUS_COLORS, TYPE_COLORS, DOCUMENT_TYPES } from "@/constants";
import { formatDate, cn } from "@/lib/utils";
import type { DocumentType, DocumentStatus } from "@/types";

export function LegislationPage() {
  const navigate = useNavigate();
  const { documents } = useDocumentStore();

  const grouped = DOCUMENT_TYPES.reduce((acc, type) => {
    acc[type] = documents.filter((d) => d.documentType === type);
    return acc;
  }, {} as Record<DocumentType, typeof documents>);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Legislation</h1>
          <p className="text-sm text-gray-500 mt-1">All legislative documents organized by type</p>
        </div>
        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => navigate("/legislation/new")}>
          New Document
        </Button>
      </div>

      {/* Type Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {DOCUMENT_TYPES.map((type) => {
          const c = TYPE_COLORS[type];
          const count = grouped[type]?.length ?? 0;
          return (
            <button
              key={type}
              onClick={() => navigate(`/records?type=${type}`)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                "hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                c.bg, "border-transparent"
              )}
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white/60", c.text)}>
                {type === "Ordinance" ? <Scale className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
              </div>
              <div className="text-center">
                <p className={cn("text-xs font-semibold", c.text)}>{type}</p>
                <p className="text-lg font-bold text-gray-900">{count}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Recent per each type */}
      <div className="space-y-4">
        {DOCUMENT_TYPES.filter((t) => (grouped[t]?.length ?? 0) > 0).map((type) => {
          const docs = grouped[type].slice(0, 3);
          const c = TYPE_COLORS[type];
          return (
            <Card key={type} padding="none" className="overflow-hidden">
              <div className={cn("flex items-center justify-between px-5 py-3 border-b border-gray-50", c.bg)}>
                <div className="flex items-center gap-2">
                  <span className={cn("text-sm font-semibold", c.text)}>{type}</span>
                  <Badge variant="default" size="sm">{grouped[type].length}</Badge>
                </div>
                <button
                  onClick={() => navigate(`/records?type=${type}`)}
                  className={cn("text-xs font-medium flex items-center gap-1 cursor-pointer", c.text)}
                >
                  View all <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-gray-50">
                {docs.map((doc) => {
                  const sc = STATUS_COLORS[doc.status as DocumentStatus];
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/legislation/${doc.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{doc.documentNumber} · {doc.authorName} · {formatDate(doc.sessionDate)}</p>
                      </div>
                      <span className={cn("flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", sc.bg, sc.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", sc.dot)} />
                        {doc.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}