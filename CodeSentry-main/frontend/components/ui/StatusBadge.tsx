import { getStatusColor } from "@/lib/utils";

export default function StatusBadge({ status }: { status: string }) {
  const colorClass = getStatusColor(status);
  
  return (
    <span className={`uppercase text-xs tracking-widest font-medium ${colorClass}`}>
      {status}
    </span>
  );
}
