import { CONTENT_DISCLAIMER } from "@/data/public-content";

export function DemoContentNotice({ className = "" }: { className?: string }) {
  return (
    <div className={`pub-demo-banner ${className}`} role="note">
      <div className="pub-container py-2.5">{CONTENT_DISCLAIMER}</div>
    </div>
  );
}
