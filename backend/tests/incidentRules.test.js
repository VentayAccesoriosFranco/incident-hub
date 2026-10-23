const { canTransition, TRANSITIONS } = require('../src/domain/incidentRules');

describe('canTransition', () => {
  it('permite el flujo normal NUEVO -> ASIGNADO -> EN_PROCESO -> RESUELTO -> CERRADO', () => {
    expect(canTransition('NUEVO', 'ASIGNADO')).toBe(true);
    expect(canTransition('ASIGNADO', 'EN_PROCESO')).toBe(true);
    expect(canTransition('EN_PROCESO', 'RESUELTO')).toBe(true);
    expect(canTransition('RESUELTO', 'CERRADO')).toBe(true);
  });

  it('permite reabrir un incidente resuelto', () => {
    expect(canTransition('RESUELTO', 'EN_PROCESO')).toBe(true);
  });

  it('rechaza saltos de estado', () => {
    expect(canTransition('NUEVO', 'RESUELTO')).toBe(false);
    expect(canTransition('NUEVO', 'CERRADO')).toBe(false);
  });

  it('no permite salir de CERRADO', () => {
    expect(TRANSITIONS.CERRADO).toEqual([]);
    expect(canTransition('CERRADO', 'NUEVO')).toBe(false);
  });
});