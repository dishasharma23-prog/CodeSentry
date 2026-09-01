export default function LoadingSpinner({ text = "PROCESSING..." }: { text?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 bg-cs-accent animate-pulse rounded-full" />
      <span className="text-xs uppercase tracking-widest text-cs-text-muted">
        {text}
      </span>
    </div>
  );
}
