export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(n: number | undefined): string {
  if (n === undefined) return "0";
  return new Intl.NumberFormat("en-US").format(n);
}

export function getLanguageColor(lang: string | undefined): string {
  if (!lang) return "text-cs-text-secondary";
  const colors: Record<string, string> = {
    python: "text-blue-400",
    typescript: "text-blue-500",
    javascript: "text-yellow-400",
    go: "text-cyan-400",
    rust: "text-orange-500",
    java: "text-red-400",
    c: "text-gray-400",
    cpp: "text-blue-600",
  };
  return colors[lang.toLowerCase()] || "text-cs-text-secondary";
}

export function getSeverityColor(severity: string): string {
  const s = severity.toLowerCase();
  if (s === 'critical') return "text-cs-critical";
  if (s === 'high') return "text-cs-high";
  if (s === 'medium') return "text-cs-medium";
  if (s === 'low') return "text-cs-low";
  return "text-cs-info";
}

export function getStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === 'ready') return "text-cs-accent";
  if (s === 'failed') return "text-cs-critical";
  if (s === 'pending') return "text-cs-text-muted";
  return "text-amber-500";
}

export function timeAgo(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}
