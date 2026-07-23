import { HelpCircle, BookOpen, MessageSquare, FileText, ExternalLink } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";

export function HelpPage() {
  const faqs = [
    { q: "How do I create a new legislative document?", a: "Click the 'New Document' button in the top header or from the Dashboard quick actions. Fill in all required fields and click Save." },
    { q: "How do I search for a specific ordinance?", a: "Use the global search bar in the top header or navigate to the Search page for advanced filtering by type, status, committee, and year." },
    { q: "What is the difference between Digital and Paper storage types?", a: "Digital means the document exists only in electronic form. Paper means it exists in physical form. Both means copies exist in both formats." },
    { q: "How do I export records?", a: "On the Records page, use the 'Export CSV' button at the bottom. For full reports, navigate to the Reports section." },
    { q: "How are document numbers generated?", a: "Document numbers are automatically generated based on type prefix (ORD, RES, etc.), year, and sequential number within that year and type." },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-display">Help & Support</h1>
        <p className="text-sm text-gray-500 mt-1">Documentation and frequently asked questions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: BookOpen, label: "Documentation", desc: "Full user guide" },
          { icon: MessageSquare, label: "Contact IT", desc: "Report an issue" },
          { icon: FileText, label: "Changelog", desc: "What's new in v2.0" },
        ].map(({ icon: Icon, label, desc }) => (
          <Card key={label} hover padding="md" className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Icon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{label}</p>
              <p className="text-xs text-gray-400">{desc}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-300" />
          </Card>
        ))}
      </div>

      <Card padding="md">
        <CardHeader title="Frequently Asked Questions" description="Common questions about CLINDEX 2.0" />
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
              <p className="text-sm font-semibold text-gray-900 mb-1.5">{faq.q}</p>
              <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}