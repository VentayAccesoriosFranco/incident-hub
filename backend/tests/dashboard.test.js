const request = require('supertest');

jest.mock('../src/db', () => ({ query: jest.fn() }));

const pool = require('../src/db');
const app = require('../src/app');

beforeEach(() => {
  pool.query.mockReset();
});

describe('GET /api/dashboard', () => {
  it('devuelve los indicadores y las distribuciones', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: 10, open: 7, closed: 3, critical: 2 }] })
      .mockResolvedValueOnce({ rows: [{ status: 'NUEVO', count: 4 }, { status: 'CERRADO', count: 3 }] })
      .mockResolvedValueOnce({ rows: [{ category: 'Hardware', count: 6 }, { category: 'Software', count: 4 }] })
      .mockResolvedValueOnce({ rows: [{ technician_id: 2, name: 'Tecnico Uno', count: 5 }] });

    const res = await request(app).get('/api/dashboard');

    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(10);
    expect(res.body.open).toBe(7);
    expect(res.body.closed).toBe(3);
    expect(res.body.critical).toBe(2);
    expect(res.body.byStatus).toHaveLength(2);
    expect(res.body.byCategory[0].category).toBe('Hardware');
    expect(res.body.byTechnician[0].name).toBe('Tecnico Uno');
    expect(pool.query).toHaveBeenCalledTimes(4);
  });

  it('devuelve ceros y listas vacías si no hay incidentes', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ total: 0, open: 0, closed: 0, critical: 0 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get('/api/dashboard');

    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.byCategory).toEqual([]);
  });

  it('responde 500 si la base de datos falla', async () => {
    pool.query.mockRejectedValue(new Error('fallo de conexion'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app).get('/api/dashboard');

    expect(res.statusCode).toBe(500);
    spy.mockRestore();
  });
});