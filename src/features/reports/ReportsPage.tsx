import { useMemo } from "react";
import { Download, BarChart3, TrendingUp, FileText } from "lucide-react";
import { useDocumentStore } from "@/store/useDocumentStore";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CURRENT_YEAR, DOCUMENT_TYPES, DOCUMENT_STATUSES } from "@/constants";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from "recharts";

const COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#dc2626", "#64748b"];

export function ReportsPage() {
  const { documents } = useDocumentStore();

  const stats = useMemo(() => {
    const byType = DOCUMENT_TYPES.map((t) => ({
      name: t,
      count: documents.filter((d) => d.documentType === t).length,
    }));
    const byStatus = DOCUMENT_STATUSES.map((s) => ({
      name: s,
      count: documents.filter((d) => d.status === s).length,
    })).filter((s) => s.count > 0);
    const byYear = Array.from({ length: 5 }, (_, i) => {
      const yr = CURRENT_YEAR - (4 - i);
      return { year: String(yr), count: documents.filter((d) => d.year === yr).length };
    });
    const byCommittee = Object.entries(
      documents.reduce((acc, d) => { acc[d.committee] = (acc[d.committee] ?? 0) + 1; return acc; }, {} as Record<string, number>)
    ).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);

    return { byType, byStatus, byYear, byCommittee };
  }, [documents]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-display">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of all legislative activity</p>
        </div>
        <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>Export Report</Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Records", value: documents.length, icon: FileText, color: "text-blue-600 bg-blue-50" },
          { label: "This Year", value: documents.filter((d) => d.year === CURRENT_YEAR).length, icon: BarChart3, color: "text-violet-600 bg-violet-50" },
          { label: "Approved", value: documents.filter((d) => d.status === "Approved").length, icon: TrendingUp, color: "text-green-600 bg-green-50" },
          { label: "Pending", value: documents.filter((d) => d.status === "Pending" || d.status === "Draft").length, icon: FileText, color: "text-amber-600 bg-amber-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} padding="md">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card padding="md">
          <CardHeader title="Documents by Type" description="Distribution of legislative documents" />
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byType} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="md">
          <CardHeader title="Documents by Status" description="Current status breakdown" />
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.byStatus} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={3}>
                  {stats.byStatus.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="md">
          <CardHeader title="5-Year Trend" description="Documents filed per year" />
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.byYear} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                <Line type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: "#2563eb", r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card padding="md">
          <CardHeader title="By Committee" description="Documents per committee" />
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byCommittee} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e5e7eb", fontSize: "12px" }} />
                <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}