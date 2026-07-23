import { Settings, User, Bell, Shield, Database, Palette } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function SettingsPage() {
  const sections = [
    { icon: User, label: "Profile", desc: "Manage your account information and preferences" },
    { icon: Bell, label: "Notifications", desc: "Configure notification preferences and alerts" },
    { icon: Shield, label: "Security", desc: "Password, 2FA, and session management" },
    { icon: Database, label: "Data Management", desc: "Export, backup, and data retention settings" },
    { icon: Palette, label: "Appearance", desc: "Theme, language, and display preferences" },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-display">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your CLINDEX preferences and configuration</p>
      </div>
      <Card padding="md">
        <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            AS
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">Admin Staff</p>
            <p className="text-sm text-gray-500">Legislative Office · Sangguniang Panlungsod</p>
            <span className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
            </span>
          </div>
        </div>
        <div className="pt-5 grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm">Edit Profile</Button>
          <Button variant="ghost" size="sm">Change Password</Button>
        </div>
      </Card>

      <div className="space-y-3">
        {sections.map(({ icon: Icon, label, desc }) => (
          <Card key={label} hover padding="md" className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">{label}</p>
              <p className="text-xs text-gray-500">{desc}</p>
            </div>
            <span className="text-gray-300 text-lg">›</span>
          </Card>
        ))}
      </div>

      <Card padding="md">
        <CardHeader title="System Information" />
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ["Application", "CLINDEX 2.0"],
            ["Version", "2.0.0"],
            ["Environment", "Development"],
            ["Build Date", "July 2026"],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-medium text-gray-700">{value}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}