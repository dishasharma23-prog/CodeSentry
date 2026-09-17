export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const SEVERITY_COLORS = {
  critical: 'text-cs-critical',
  high: 'text-cs-high',
  medium: 'text-cs-medium',
  low: 'text-cs-low',
  informational: 'text-cs-info'
};

export const STATUS_COLORS = {
  ready: 'text-cs-accent',
  pending: 'text-cs-text-muted',
  cloning: 'text-amber-500',
  parsing: 'text-amber-500',
  indexing: 'text-amber-500',
  failed: 'text-cs-critical'
};
