import request from 'supertest';

jest.mock('../src/services/repository.service', () => ({
  repositoryService: {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    getStatus: jest.fn(),
    processRepository: jest.fn(() => Promise.resolve()),
    delete: jest.fn(),
  },
}));
jest.mock('../src/services/ragService.client', () => ({
  ragServiceClient: { query: jest.fn(), analyzeSecurity: jest.fn() },
}));
jest.mock('../src/models/QueryHistory', () => ({
  QueryHistory: jest.fn().mockImplementation(() => ({ save: jest.fn().mockResolvedValue(undefined) })),
}));

import app from '../src/app';
import { NotFoundError } from '../src/middleware/errorHandler';
import { repositoryService } from '../src/services/repository.service';
import { ragServiceClient } from '../src/services/ragService.client';

const repos = repositoryService as jest.Mocked<typeof repositoryService>;
const rag = ragServiceClient as jest.Mocked<typeof ragServiceClient>;
const ID = '3f1c2a9e-8b7d-4c6e-9a1b-2d3e4f5a6b7c';

beforeEach(() => jest.clearAllMocks());

describe('health', () => {
  it('reports ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('POST /api/repositories', () => {
  it('creates a repository for a GitHub URL', async () => {
    repos.create.mockResolvedValue({ id: ID, url: 'https://github.com/pallets/flask' } as any);
    const res = await request(app).post('/api/repositories').send({ url: 'https://github.com/pallets/flask' });
    expect(res.status).toBe(201);
    expect(repos.create).toHaveBeenCalledWith('https://github.com/pallets/flask');
  });

  it.each([
    ['missing url', {}],
    ['not a URL', { url: 'flask' }],
    ['another host', { url: 'https://gitlab.com/pallets/flask' }],
    ['github.com only in the path', { url: 'https://evil.example.com/github.com/x' }],
    ['look-alike host', { url: 'https://github.com.evil.example.com/x/y' }],
    ['look-alike host without a dot', { url: 'https://notgithub.com/x/y' }],
    ['url is a number', { url: 42 }],
  ])('rejects %s with a 400 and never reaches the service', async (_name, body) => {
    const res = await request(app).post('/api/repositories').send(body);
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ error: true, statusCode: 400 });
    expect(repos.create).not.toHaveBeenCalled();
  });

  it('answers malformed JSON with a 400, not a server error', async () => {
    const res = await request(app)
      .post('/api/repositories')
      .set('Content-Type', 'application/json')
      .send('{"url": ');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(true);
  });
});

describe('repository by id', () => {
  it('rejects an id that is not a UUID', async () => {
    const res = await request(app).get('/api/repositories/not-a-uuid');
    expect(res.status).toBe(400);
    expect(repos.findById).not.toHaveBeenCalled();
  });

  it('returns 404 JSON when the repository does not exist', async () => {
    repos.findById.mockRejectedValue(new NotFoundError('Repository not found'));
    const res = await request(app).get(`/api/repositories/${ID}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: true, message: 'Repository not found', statusCode: 404 });
  });

  it('hides internal error details in production', async () => {
    const before = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    repos.findById.mockRejectedValue(new Error('connection string mongodb://user:secret@db'));
    const res = await request(app).get(`/api/repositories/${ID}`);
    process.env.NODE_ENV = before;
    expect(res.status).toBe(500);
    expect(res.body.message).toBe('Internal server error');
  });
});

describe('POST /api/repositories/:id/query', () => {
  it('passes a valid question to the RAG service with the default top_k', async () => {
    repos.findById.mockResolvedValue({ id: ID } as any);
    rag.query.mockResolvedValue({ answer: 'In errorHandler.ts', sources: [] } as any);
    const res = await request(app).post(`/api/repositories/${ID}/query`).send({ query: 'Where are errors handled?' });
    expect(res.status).toBe(200);
    expect(rag.query).toHaveBeenCalledWith(ID, 'Where are errors handled?', 5);
  });

  it.each([
    ['query too short', { query: 'hi' }],
    ['query too long', { query: 'x'.repeat(1001) }],
    ['top_k above 20', { query: 'Where are errors handled?', top_k: 50 }],
    ['top_k not a whole number', { query: 'Where are errors handled?', top_k: 2.5 }],
    ['top_k as text', { query: 'Where are errors handled?', top_k: 'five' }],
  ])('rejects %s with a 400', async (_name, body) => {
    const res = await request(app).post(`/api/repositories/${ID}/query`).send(body);
    expect(res.status).toBe(400);
    expect(rag.query).not.toHaveBeenCalled();
  });

  it('returns 404 when asking about a repository that does not exist', async () => {
    repos.findById.mockRejectedValue(new NotFoundError('Repository not found'));
    const res = await request(app).post(`/api/repositories/${ID}/query`).send({ query: 'Where are errors handled?' });
    expect(res.status).toBe(404);
    expect(rag.query).not.toHaveBeenCalled();
  });
});
