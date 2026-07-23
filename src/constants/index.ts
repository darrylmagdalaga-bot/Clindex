import type { DocumentType, DocumentStatus, CommitteeType, SessionType, StorageType } from "@/types";

export const APP_NAME = "CLINDEX 2.0";
export const APP_SUBTITLE = "Legislative Records Management System";
export const APP_VERSION = "2.0.0";
export const ORGANIZATION = "Sangguniang Panlungsod";

export const DOCUMENT_TYPES: DocumentType[] = [
  "Ordinance", "Resolution", "Motion", "Order", "Proclamation", "Minutes",
];

export const DOCUMENT_STATUSES: DocumentStatus[] = [
  "Draft", "Pending", "Approved", "Vetoed", "Lapsed into Law", "Withdrawn", "Archived",
];

export const COMMITTEE_TYPES: CommitteeType[] = [
  "Finance", "Health", "Education", "Public Works", "Environment",
  "Peace and Order", "Social Services", "Agriculture", "Trade and Commerce",
  "Tourism", "Legal", "Special",
];

export const SESSION_TYPES: SessionType[] = ["Regular", "Special", "Emergency"];

export const STORAGE_TYPES: StorageType[] = ["Digital", "Paper", "Both"];

export const STATUS_COLORS: Record<DocumentStatus, { bg: string; text: string; dot: string }> = {
  Draft:             { bg: "bg-gray-100",   text: "text-gray-700",   dot: "bg-gray-400" },
  Pending:           { bg: "bg-amber-50",   text: "text-amber-700",  dot: "bg-amber-400" },
  Approved:          { bg: "bg-green-50",   text: "text-green-700",  dot: "bg-green-500" },
  Vetoed:            { bg: "bg-red-50",     text: "text-red-700",    dot: "bg-red-500" },
  "Lapsed into Law": { bg: "bg-blue-50",    text: "text-blue-700",   dot: "bg-blue-500" },
  Withdrawn:         { bg: "bg-orange-50",  text: "text-orange-700", dot: "bg-orange-500" },
  Archived:          { bg: "bg-slate-100",  text: "text-slate-600",  dot: "bg-slate-400" },
};

export const TYPE_COLORS: Record<DocumentType, { bg: string; text: string }> = {
  Ordinance:   { bg: "bg-violet-50",  text: "text-violet-700" },
  Resolution:  { bg: "bg-blue-50",    text: "text-blue-700" },
  Motion:      { bg: "bg-teal-50",    text: "text-teal-700" },
  Order:       { bg: "bg-indigo-50",  text: "text-indigo-700" },
  Proclamation:{ bg: "bg-pink-50",    text: "text-pink-700" },
  Minutes:     { bg: "bg-slate-100",  text: "text-slate-700" },
};

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
export const DEFAULT_PAGE_SIZE = 20;

export const CURRENT_YEAR = new Date().getFullYear();
export const YEAR_OPTIONS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);