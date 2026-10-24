const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const STATUSES = ['NUEVO', 'ASIGNADO', 'EN_PROCESO', 'RESUELTO', 'CERRADO'];
export const PRIORITIES = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
export const CATEGORIES = ['Hardware', 'Software', 'Red', 'Accesos', 'Correo'];

// Usuarios de demostracion (coinciden con database/schema.sql)
export const USERS = [
  { id: 1, name: 'Usuario Demo', role: 'USUARIO' },
  { id: 2, name: 'Tecnico Uno', role: 'TECNICO' },
  { id: 3, name: 'Tecnico Dos', role: 'TECNICO' },
];
export const TECHNICIANS = USERS.filter((u) => u.role === 'TECNICO');

// Estados a los que se puede pasar con el boton "cambiar estado"
// (NUEVO -> ASIGNADO se hace asignando un tecnico)
export const NEXT_STATUSES = {
  NUEVO: [],
  ASIGNADO: ['EN_PROCESO'],
  EN_PROCESO: ['RESUELTO'],
  RESUELTO: ['CERRADO', 'EN_PROCESO'],
  CERRADO: [],
};

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const message =
      (data && data.errors && data.errors.join('. ')) ||
      (data && data.error) ||
      `Error ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  listIncidents(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params.set(key, value);
      }
    });
    const qs = params.toString();
    return request(`/api/incidents${qs ? `?${qs}` : ''}`);
  },
  getIncident: (id) => request(`/api/incidents/${id}`),
  createIncident: (data) =>
    request('/api/incidents', { method: 'POST', body: JSON.stringify(data) }),
  assign: (id, technicianId) =>
    request(`/api/incidents/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ technician_id: technicianId }),
    }),
  changeStatus: (id, status) =>
    request(`/api/incidents/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  listComments: (id) => request(`/api/incidents/${id}/comments`),
  addComment: (id, authorId, body) =>
    request(`/api/incidents/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ author_id: authorId, body }),
    }),
  dashboard: () => request('/api/dashboard'),
};