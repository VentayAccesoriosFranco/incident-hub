const request = require('supertest');

jest.mock('../src/db', () => ({ query: jest.fn() }));

const pool = require('../src/db');
const app = require('../src/app');

const validIncident = {
  title: 'No funciona la impresora',
  description: 'La impresora del segundo piso no responde',
  category: 'Hardware',
  priority: 'ALTA',
  created_by: 1,
};

beforeEach(() => {
  pool.query.mockReset();
});

describe('POST /api/incidents', () => {
  it('crea un incidente y responde 201', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1, ...validIncident, status: 'NUEVO' }] });

    const res = await request(app).post('/api/incidents').send(validIncident);

    expect(res.statusCode).toBe(201);
    expect(res.body.id).toBe(1);
    expect(res.body.status).toBe('NUEVO');
    expect(pool.query).toHaveBeenCalledTimes(1);
  });

  it('responde 400 si faltan datos o son inválidos', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .send({ title: 'ab', priority: 'URGENTE' });

    expect(res.statusCode).toBe(400);
    expect(res.body.errors.length).toBeGreaterThan(0);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('responde 400 si el usuario creador no existe', async () => {
    pool.query.mockRejectedValue({ code: '23503' });

    const res = await request(app).post('/api/incidents').send(validIncident);

    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/incidents', () => {
  it('devuelve la lista de incidentes', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });

    const res = await request(app).get('/api/incidents');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('GET /api/incidents/:id', () => {
  it('devuelve un incidente existente', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 5, title: 'Prueba' }] });

    const res = await request(app).get('/api/incidents/5');

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(5);
  });

  it('responde 404 si no existe', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const res = await request(app).get('/api/incidents/999');

    expect(res.statusCode).toBe(404);
  });

  it('responde 400 si el id no es numérico', async () => {
    const res = await request(app).get('/api/incidents/abc');

    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
});