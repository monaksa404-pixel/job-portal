import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { CheckCircle2, Clock, Briefcase, Bell } from "lucide-react";

export const Route = createFileRoute("/applications/success/$applicationId")({
  head: () => ({ meta: [{ title: "Application Submitted — Job Expert" }] }),
  component: SuccessPage,
});

function SuccessPage() {
  const { applicationId } = useParams({ from: "/applications/success/$applicationId" });
  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <div className="bg-white border border-border rounded-2xl p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-brand-navy mt-4">Application Submitted!</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your application has been received. We'll notify you once it's reviewed.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 bg-blue-50 text-brand-blue px-4 py-2 rounded-xl font-semibold text-sm">
          Application ID: {applicationId}
        </div>

        <ul className="mt-6 text-left space-y-3 max-w-md mx-auto">
          <Item icon={Clock} title="Under Review" note="Admin will verify your STC payment shortly." />
          <Item icon={Bell} title="Real-time Updates" note="You'll get notifications as the status changes." />
          <Item icon={Briefcase} title="Track Your Applications" note="View all your applications in your dashboard." />
        </ul>

        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/my-applications" className="px-5 py-2.5 rounded-xl bg-brand-blue text-white font-semibold text-sm">
            View My Applications
          </Link>
          <Link to="/jobs" className="px-5 py-2.5 rounded-xl border border-border font-semibold text-sm text-brand-navy">
            Browse More Jobs
          </Link>
        </div>
      </div>
    </div>
  );
}

function Item({ icon: Icon, title, note }: { icon: typeof Clock; title: string; note: string }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="w-9 h-9 rounded-lg bg-blue-50 text-brand-blue flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </span>
      <div>
        <div className="font-semibold text-sm text-brand-navy">{title}</div>
        <div className="text-xs text-muted-foreground">{note}</div>
      </div>
    </li>
  );
}