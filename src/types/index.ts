// ── Shared enums & base types ─────────────────────────────

export type DocumentType =
  | "Ordinance"
  | "Resolution"
  | "Motion"
  | "Order"
  | "Proclamation"
  | "Minutes";

export type DocumentStatus =
  | "Draft"
  | "Pending"
  | "Approved"
  | "Vetoed"
  | "Lapsed into Law"
  | "Withdrawn"
  | "Archived";

export type CommitteeType =
  | "Finance"
  | "Health"
  | "Education"
  | "Public Works"
  | "Environment"
  | "Peace and Order"
  | "Social Services"
  | "Agriculture"
  | "Trade and Commerce"
  | "Tourism"
  | "Legal"
  | "Special";

export type SessionType =
  | "Regular"
  | "Special"
  | "Emergency";

export type StorageType = "Digital" | "Paper" | "Both";

export interface LegislativeDocument {
  id: string;
  documentNumber: string;
  documentType: DocumentType;
  title: string;
  description: string;
  status: DocumentStatus;
  committee: CommitteeType;
  authorId: string;
  authorName: string;
  coAuthors?: string[];
  sessionType: SessionType;
  sessionDate: string;
  dateIntroduced: string;
  dateApproved?: string;
  dateEffective?: string;
  publishedDate?: string;
  storageType: StorageType;
  tags: string[];
  remarks?: string;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  series: string;
  year: number;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

export interface SangguniangMember {
  id: string;
  name: string;
  position: string;
  district?: string;
  party?: string;
  status: "Active" | "Inactive";
}

export interface Committee {
  id: string;
  name: CommitteeType;
  chairpersonId: string;
  members: string[];
}

export interface DashboardStats {
  totalDocuments: number;
  ordinances: number;
  resolutions: number;
  pending: number;
  approved: number;
  thisMonth: number;
  thisYear: number;
  byType: Record<DocumentType, number>;
  byStatus: Record<DocumentStatus, number>;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  action: string;
  documentTitle: string;
  documentNumber: string;
  documentType: DocumentType;
  performedBy: string;
  timestamp: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

export interface FilterState {
  search: string;
  documentType?: DocumentType;
  status?: DocumentStatus;
  committee?: CommitteeType;
  year?: number;
  dateFrom?: string;
  dateTo?: string;
  storageType?: StorageType;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}