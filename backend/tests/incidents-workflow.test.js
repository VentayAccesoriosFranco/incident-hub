const request = require('supertest');

jest.mock('../src/db', () => ({ query: jest.fn() }));

const pool = require('../src/db');
const app = require('../src/app');

beforeEach(() => {
  pool.query.mockReset();
});

describe('GET /api/incidents con filtros', () => {
  it('aplica los filtros recibidos como parámetros', async () => {
    pool.query.mockResolvedValue({ rows: [] });

    const res = await request(app).get('/api/incidents?priority=ALTA&category=Hardware');

    expect(res.statusCode).toBe(200);
    const [sql, params] = pool.query.mock.calls[0];
    expect(sql).toContain('WHERE');
    expect(params).toEqual(['ALTA', 'Hardware']);
  });

  it('responde 400 si el estado del filtro es inválido', async () => {
    const res = await request(app).get('/api/incidents?status=INVENTADO');

    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/incidents/:id/assign', () => {
  it('asigna un técnico y pasa el incidente de NUEVO a ASIGNADO', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'NUEVO' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, role: 'TECNICO' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'ASIGNADO', assigned_to: 2 }] });

    const res = await request(app).patch('/api/incidents/1/assign').send({ technician_id: 2 });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ASIGNADO');
    expect(res.body.assigned_to).toBe(2);
  });

  it('responde 404 si el incidente no existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).patch('/api/incidents/99/assign').send({ technician_id: 2 });

    expect(res.statusCode).toBe(404);
  });

  it('responde 400 si el usuario no es técnico', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'NUEVO' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, role: 'USUARIO' }] });

    const res = await request(app).patch('/api/incidents/1/assign').send({ technician_id: 1 });

    expect(res.statusCode).toBe(400);
  });

  it('responde 409 si el incidente ya está cerrado', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'CERRADO' }] });

    const res = await request(app).patch('/api/incidents/1/assign').send({ technician_id: 2 });

    expect(res.statusCode).toBe(409);
  });

  it('responde 400 si technician_id no es válido', async () => {
    const res = await request(app).patch('/api/incidents/1/assign').send({ technician_id: 'abc' });

    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/incidents/:id/status', () => {
  it('permite una transición válida', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'ASIGNADO', assigned_to: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'EN_PROCESO' }] });

    const res = await request(app).patch('/api/incidents/1/status').send({ status: 'EN_PROCESO' });

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('EN_PROCESO');
  });

  it('rechaza una transición no permitida con 409', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'NUEVO', assigned_to: null }] });

    const res = await request(app).patch('/api/incidents/1/status').send({ status: 'RESUELTO' });

    expect(res.statusCode).toBe(409);
  });

  it('exige técnico asignado para pasar a ASIGNADO', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1, status: 'NUEVO', assigned_to: null }] });

    const res = await request(app).patch('/api/incidents/1/status').send({ status: 'ASIGNADO' });

    expect(res.statusCode).toBe(409);
  });

  it('responde 400 si el estado enviado no existe', async () => {
    const res = await request(app).patch('/api/incidents/1/status').send({ status: 'INVENTADO' });

    expect(res.statusCode).toBe(400);
    expect(pool.query).not.toHaveBeenCalled();
  });

  it('responde 404 si el incidente no existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const res = await request(app).patch('/api/incidents/99/status').send({ status: 'EN_PROCESO' });

    expect(res.statusCode).toBe(404);
  });
});