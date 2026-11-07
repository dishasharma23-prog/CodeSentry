import { z } from 'zod';

const isGitHubUrl = (value: string) => {
  try {
    const { protocol, hostname } = new URL(value);
    return (protocol === 'https:' || protocol === 'http:') && ['github.com', 'www.github.com'].includes(hostname);
  } catch {
    return false;
  }
};

export const createRepositorySchema = z.object({
  url: z.string().url().refine(isGitHubUrl, {
    message: "Must be a valid GitHub URL",
  }),
});

export const querySchema = z.object({
  query: z.string().min(3).max(1000),
  top_k: z.number().int().min(1).max(20).optional().default(5),
});

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const idAndFileParamSchema = z.object({
  id: z.string().uuid(),
}).passthrough();
