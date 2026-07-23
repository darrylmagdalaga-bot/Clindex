import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, FileText, Calendar, User, Tag, Scale, Building2,
  BookOpen, CheckCircle2, Clock, AlertCircle, Edit, Trash2, Download
} from "lucide-react";
import { useDocumentStore } from "@/store/useDocumentStore";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { STATUS_COLORS, TYPE_COLORS } from "@/constants";
import { formatDateLong, cn } from "@/lib/utils";
import type { DocumentStatus, DocumentType } from "@/types";
import toast from "react-hot-toast";

export function DocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getDocumentById, deleteDocument } = useDocumentStore();
  const doc = getDocumentById(id ?? "");

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <FileText className="w-12 h-12 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-700">Document not found</h2>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)} icon={<ArrowLeft className="w-4 h-4" />}>
          Go back
        </Button>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[doc.status as DocumentStatus];
  const typeColor = TYPE_COLORS[doc.documentType as DocumentType];

  const handleDelete = () => {
    if (confirm(`Delete "${doc.title}"? This action cannot be undone.`)) {
      deleteDocument(doc.id);
      toast.success("Document deleted.");
      navigate("/records");
    }
  };

  const Field = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) => (
    value ? (
      <div className="flex items-start gap-3">
        <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 flex-shrink-0 mt-0.5">{icon}</span>
        <div>
          <p className="text-xs text-gray-400 font-medium">{label}</p>
          <p className="text-sm text-gray-800 font-medium mt-0.5">{value}</p>
        </div>
      </div>
    ) : null
  );

  return (
    <div className="space-y-5 animate-fade-in max-w-4xl">
      {/* Back + Actions */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>Export</Button>
          <Button variant="outline" size="sm" icon={<Edit className="w-4 h-4" />} onClick={() => navigate(`/legislation/${doc.id}/edit`)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" icon={<Trash2 className="w-4 h-4" />} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      {/* Title Card */}
      <Card padding="lg">
        <div className="flex items-start gap-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", typeColor.bg)}>
            {doc.documentType === "Ordinance" ? (
              <Scale className={cn("w-6 h-6", typeColor.text)} />
            ) : (
              <FileText className={cn("w-6 h-6", typeColor.text)} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-semibold", typeColor.bg, typeColor.text)}>
                {doc.documentType}
              </span>
              <span className="font-mono text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full font-semibold">
                {doc.documentNumber}
              </span>
              <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium", statusColor.bg, statusColor.text)}>
                <span className={cn("w-1.5 h-1.5 rounded-full", statusColor.dot)} />
                {doc.status}
              </span>
            </div>
            <h1 className="text-lg font-bold text-gray-900 leading-snug">{doc.title}</h1>
            {doc.description && (
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">{doc.description}</p>
            )}
            {doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {doc.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <Tag className="w-2.5 h-2.5" />{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="md">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Document Information</h3>
          <div className="space-y-3">
            <Field icon={<User className="w-4 h-4" />} label="Author" value={doc.authorName} />
            {doc.coAuthors?.length && (
              <Field icon={<User className="w-4 h-4" />} label="Co-Authors" value={doc.coAuthors.join(", ")} />
            )}
            <Field icon={<Building2 className="w-4 h-4" />} label="Committee" value={doc.committee} />
            <Field icon={<BookOpen className="w-4 h-4" />} label="Session Type" value={doc.sessionType} />
            <Field icon={<Scale className="w-4 h-4" />} label="Storage Type" value={doc.storageType} />
          </div>
        </Card>

        <Card padding="md">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Timeline</h3>
          <div className="space-y-3">
            <Field icon={<Calendar className="w-4 h-4" />} label="Date Introduced" value={formatDateLong(doc.dateIntroduced)} />
            <Field icon={<Calendar className="w-4 h-4" />} label="Session Date" value={formatDateLong(doc.sessionDate)} />
            <Field icon={<CheckCircle2 className="w-4 h-4" />} label="Date Approved" value={doc.dateApproved ? formatDateLong(doc.dateApproved) : undefined} />
            <Field icon={<Clock className="w-4 h-4" />} label="Date Effective" value={doc.dateEffective ? formatDateLong(doc.dateEffective) : undefined} />
            <Field icon={<AlertCircle className="w-4 h-4" />} label="Published" value={doc.publishedDate ? formatDateLong(doc.publishedDate) : undefined} />
          </div>
        </Card>
      </div>

      {/* Audit */}
      <Card padding="md">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Audit Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-400">Created by</p>
            <p className="text-gray-700 font-medium mt-0.5">{doc.createdBy}</p>
            <p className="text-xs text-gray-400 mt-2">Created at</p>
            <p className="text-gray-700 font-medium mt-0.5">{formatDateLong(doc.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Last updated by</p>
            <p className="text-gray-700 font-medium mt-0.5">{doc.updatedBy}</p>
            <p className="text-xs text-gray-400 mt-2">Last updated at</p>
            <p className="text-gray-700 font-medium mt-0.5">{formatDateLong(doc.updatedAt)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}