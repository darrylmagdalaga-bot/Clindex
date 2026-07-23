import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, X } from "lucide-react";
import toast from "react-hot-toast";
import { useDocumentStore } from "@/store/useDocumentStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/ui/Card";
import {
  DOCUMENT_TYPES, DOCUMENT_STATUSES, COMMITTEE_TYPES, SESSION_TYPES, STORAGE_TYPES, CURRENT_YEAR
} from "@/constants";
import { generateId } from "@/lib/utils";
import type { LegislativeDocument } from "@/types";

const schema = z.object({
  documentType: z.enum(["Ordinance", "Resolution", "Motion", "Order", "Proclamation", "Minutes"]),
  series: z.string().min(1, "Series is required"),
  year: z.number().min(2000).max(2100),
  title: z.string().min(10, "Title must be at least 10 characters"),
  description: z.string().optional(),
  status: z.enum(["Draft", "Pending", "Approved", "Vetoed", "Lapsed into Law", "Withdrawn", "Archived"]),
  committee: z.enum(["Finance", "Health", "Education", "Public Works", "Environment", "Peace and Order", "Social Services", "Agriculture", "Trade and Commerce", "Tourism", "Legal", "Special"]),
  authorName: z.string().min(2, "Author name is required"),
  sessionType: z.enum(["Regular", "Special", "Emergency"]),
  sessionDate: z.string().min(1, "Session date is required"),
  dateIntroduced: z.string().min(1, "Date introduced is required"),
  dateApproved: z.string().optional(),
  dateEffective: z.string().optional(),
  storageType: z.enum(["Digital", "Paper", "Both"]),
  tagsInput: z.string().optional(),
  remarks: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function NewDocumentPage() {
  const navigate = useNavigate();
  const { addDocument, documents } = useDocumentStore();

  const {
    register, handleSubmit, watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      documentType: "Ordinance",
      year: CURRENT_YEAR,
      series: String(CURRENT_YEAR),
      status: "Draft",
      sessionType: "Regular",
      storageType: "Both",
      dateIntroduced: new Date().toISOString().split("T")[0],
      sessionDate: new Date().toISOString().split("T")[0],
    },
  });

  const watchType = watch("documentType");
  const watchYear = watch("year");

  const getNextNumber = () => {
    const prefix = watchType === "Ordinance" ? "ORD" : watchType === "Resolution" ? "RES" : watchType.slice(0, 3).toUpperCase();
    const same = documents.filter((d) => d.documentType === watchType && d.year === Number(watchYear));
    return `${prefix}-${watchYear}-${String(same.length + 1).padStart(3, "0")}`;
  };

  const onSubmit = async (data: FormData) => {
    await new Promise((r) => setTimeout(r, 600));
    const doc: LegislativeDocument = {
      id: `doc-${generateId()}`,
      documentNumber: getNextNumber(),
      documentType: data.documentType,
      title: data.title,
      description: data.description ?? "",
      status: data.status,
      committee: data.committee,
      authorId: `mem-${generateId()}`,
      authorName: data.authorName,
      sessionType: data.sessionType,
      sessionDate: data.sessionDate,
      dateIntroduced: data.dateIntroduced,
      dateApproved: data.dateApproved,
      dateEffective: data.dateEffective,
      storageType: data.storageType,
      tags: data.tagsInput ? data.tagsInput.split(",").map((t) => t.trim()).filter(Boolean) : [],
      remarks: data.remarks,
      series: data.series,
      year: Number(data.year),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "admin",
      updatedBy: "admin",
    };
    addDocument(doc);
    toast.success(`${data.documentType} created successfully!`);
    navigate(`/legislation/${doc.id}`);
  };

  const Section = ({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>}
      </div>
      <div className="md:col-span-2">
        <Card padding="md">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 font-display">New Legislative Document</h1>
            <p className="text-sm text-gray-500 mt-0.5">Document No: <span className="font-mono font-semibold text-blue-600">{getNextNumber()}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" icon={<X className="w-4 h-4" />} onClick={() => navigate(-1)}>Discard</Button>
          <Button size="sm" icon={<Save className="w-4 h-4" />} loading={isSubmitting} onClick={handleSubmit(onSubmit)}>
            Save Document
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Document Classification */}
        <Section title="Document Classification" description="Basic classification and identification of the legislative document.">
          <Select
            label="Document Type"
            required
            options={DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))}
            {...register("documentType")}
            error={errors.documentType?.message}
          />
          <Select
            label="Status"
            required
            options={DOCUMENT_STATUSES.map((s) => ({ value: s, label: s }))}
            {...register("status")}
            error={errors.status?.message}
          />
          <Input
            label="Series"
            required
            placeholder="e.g. 2026"
            {...register("series")}
            error={errors.series?.message}
          />
          <Input
            label="Year"
            type="number"
            required
            {...register("year", { valueAsNumber: true })}
            error={errors.year?.message}
          />
          <Select
            label="Storage Type"
            required
            options={STORAGE_TYPES.map((s) => ({ value: s, label: s }))}
            {...register("storageType")}
            error={errors.storageType?.message}
          />
        </Section>

        {/* Document Content */}
        <div className="border-t border-gray-100" />
        <Section title="Document Content" description="Full title and description of the legislative document.">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Full Title <span className="text-red-500">*</span>
            </label>
            <textarea
              placeholder="An Ordinance/Resolution providing for..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-400"
              {...register("title")}
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Description / Subject Matter</label>
            <textarea
              placeholder="Brief description of the document's content and purpose..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-400"
              {...register("description")}
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Tags"
              placeholder="health, environment, budget (comma-separated)"
              {...register("tagsInput")}
              hint="Separate tags with commas"
            />
          </div>
        </Section>

        {/* Authorship & Committee */}
        <div className="border-t border-gray-100" />
        <Section title="Authorship & Committee" description="Author information and committee assignment.">
          <div className="sm:col-span-2">
            <Input
              label="Principal Author"
              required
              placeholder="e.g. Hon. Maria Santos"
              {...register("authorName")}
              error={errors.authorName?.message}
            />
          </div>
          <div className="sm:col-span-2">
            <Select
              label="Referred to Committee"
              required
              options={COMMITTEE_TYPES.map((c) => ({ value: c, label: `Committee on ${c}` }))}
              {...register("committee")}
              error={errors.committee?.message}
            />
          </div>
        </Section>

        {/* Session Information */}
        <div className="border-t border-gray-100" />
        <Section title="Session Information" description="Session details and important legislative dates.">
          <Select
            label="Session Type"
            required
            options={SESSION_TYPES.map((s) => ({ value: s, label: `${s} Session` }))}
            {...register("sessionType")}
            error={errors.sessionType?.message}
          />
          <Input
            label="Session Date"
            type="date"
            required
            {...register("sessionDate")}
            error={errors.sessionDate?.message}
          />
          <Input
            label="Date Introduced"
            type="date"
            required
            {...register("dateIntroduced")}
            error={errors.dateIntroduced?.message}
          />
          <Input label="Date Approved" type="date" {...register("dateApproved")} />
          <Input label="Date Effective" type="date" {...register("dateEffective")} />
        </Section>

        {/* Remarks */}
        <div className="border-t border-gray-100" />
        <Section title="Remarks" description="Additional notes or observations about this document.">
          <div className="sm:col-span-2">
            <textarea
              placeholder="Any additional notes..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none placeholder-gray-400"
              {...register("remarks")}
            />
          </div>
        </Section>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 pb-6">
          <Button variant="ghost" size="md" onClick={() => navigate(-1)} type="button">Discard Changes</Button>
          <Button size="md" icon={<Save className="w-4 h-4" />} loading={isSubmitting} type="submit">
            Save Document
          </Button>
        </div>
      </form>
    </div>
  );
}