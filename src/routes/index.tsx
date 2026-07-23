import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { Skeleton } from "@/components/ui/Skeleton";

const DashboardPage      = lazy(() => import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const LegislationPage    = lazy(() => import("@/features/legislation/LegislationPage").then((m) => ({ default: m.LegislationPage })));
const NewDocumentPage    = lazy(() => import("@/features/legislation/NewDocumentPage").then((m) => ({ default: m.NewDocumentPage })));
const DocumentDetailPage = lazy(() => import("@/features/legislation/DocumentDetailPage").then((m) => ({ default: m.DocumentDetailPage })));
const RecordsPage        = lazy(() => import("@/features/records/RecordsPage").then((m) => ({ default: m.RecordsPage })));
const SearchPage         = lazy(() => import("@/features/search/SearchPage").then((m) => ({ default: m.SearchPage })));
const ReportsPage        = lazy(() => import("@/features/reports/ReportsPage").then((m) => ({ default: m.ReportsPage })));
const ArchivePage        = lazy(() => import("@/features/archive/ArchivePage").then((m) => ({ default: m.ArchivePage })));
const SettingsPage       = lazy(() => import("@/features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const HelpPage           = lazy(() => import("@/features/help/HelpPage").then((m) => ({ default: m.HelpPage })));

function PageLoader() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <div className="grid grid-cols-4 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
      <Skeleton className="h-64 rounded-xl mt-4" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="legislation" element={<LegislationPage />} />
          <Route path="legislation/new" element={<NewDocumentPage />} />
          <Route path="legislation/:id" element={<DocumentDetailPage />} />
          <Route path="legislation/:id/edit" element={<NewDocumentPage />} />
          <Route path="records" element={<RecordsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="archive" element={<ArchivePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="help" element={<HelpPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}