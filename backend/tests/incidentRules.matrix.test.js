const { canTransition } = require('../src/domain/incidentRules');

// Tabla independiente de la implementacion: define el comportamiento esperado
const PERMITIDAS = {
  NUEVO: ['ASIGNADO'],
  ASIGNADO: ['EN_PROCESO'],
  EN_PROCESO: ['RESUELTO'],
  RESUELTO: ['CERRADO', 'EN_PROCESO'],
  CERRADO: [],
};

const estados = Object.keys(PERMITIDAS);

describe('matriz completa de transiciones', () => {
  const casos = [];
  for (const desde of estados) {
    for (const hacia of estados) {
      casos.push([desde, hacia, PERMITIDAS[desde].includes(hacia)]);
    }
  }

  test.each(casos)('%s -> %s deberia ser %s', (desde, hacia, esperado) => {
    expect(canTransition(desde, hacia)).toBe(esperado);
  });

  test('CERRADO es un estado terminal', () => {
    for (const hacia of estados) {
      expect(canTransition('CERRADO', hacia)).toBe(false);
    }
  });

  test('ningun estado puede pasar a si mismo', () => {
    for (const estado of estados) {
      expect(canTransition(estado, estado)).toBe(false);
    }
  });
});