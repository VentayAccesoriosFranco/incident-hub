const request = require('supertest');

jest.mock('../src/db', () => ({ query: jest.fn() }));

const pool = require('../src/db');
const app = require('../src/app');

beforeEach(() => {
  pool.query.mockReset();
});

describe('POST /api/incidents/:id/comments', () => {
  it('registra un comentario y responde 201', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 10, incident_id: 1, author_id: 2, body: 'Revisando el equipo' }] });

    const res = await request(app)
      .post('/api/incidents/1/comments')
      .send({ author_id: 2, body: 'Revisando el equipo' });

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(10);
    expect(pool.query).toHaveBeenCalledTimes(2);
  });

  it('responde 404 si el incidente no existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/api/incidents/99/comments')
      .send({ author_id: 2, body: 'Hola' });

    expect(res.statusCode).toBe(404);
  });

  it('responde 400 si el cuerpo o el autor son inválidos', async () => {
    const res = await request(app)
      .post('/api/incidents/1/comments')
      .send({ author_id: 'x', body: '   ' });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors.length).toBe(2);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('responde 400 si el autor no existe', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockRejectedValueOnce({ code: '23503' });

    const res = await request(app)
      .post('/api/incidents/1/comments')
      .send({ author_id: 999, body: 'Comentario' });

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/incidents/:id/comments', () => {
  it('devuelve la bitácora del incidente', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 10 }, { id: 11 }] });

    const res = await request(app).get('/api/incidents/1/comments');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('responde 404 si el incidente no existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/incidents/99/comments');

    expect(res.statusCode).toBe(404);
  });

  it('responde 400 si el id no es numérico', async () => {
    const res = await request(app).get('/api/incidents/abc/comments');

    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
});