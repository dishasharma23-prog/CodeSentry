import { getSeverityColor } from "@/lib/utils";

export default function SeverityBadge({ severity }: { severity: string }) {
  const colorClass = getSeverityColor(severity);
  
  return (
    <span className={`uppercase text-xs tracking-widest font-medium ${colorClass}`}>
      {severity}
    </span>
  );
}
