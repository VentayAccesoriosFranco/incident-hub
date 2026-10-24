import { useCallback, useEffect, useState } from 'react';
import {
  api,
  STATUSES,
  PRIORITIES,
  CATEGORIES,
  USERS,
  TECHNICIANS,
  NEXT_STATUSES,
} from './api';
import './App.css';

function formatDate(value) {
  return value ? new Date(value).toLocaleString('es-GT') : '';
}

function Badge({ kind, value }) {
  return <span className={`badge ${kind}-${value}`}>{value.replace('_', ' ')}</span>;
}

/* ---------- Listado con filtros (Task 18) ---------- */
function IncidentList({ refreshKey, selectedId, onSelect }) {
  const emptyFilters = { status: '', priority: '', category: '', assigned_to: '' };
  const [draft, setDraft] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [incidents, setIncidents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .listIncidents(filters)
      .then((rows) => {
        if (active) {
          setIncidents(rows);
          setError('');
        }
      })
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [filters, refreshKey]);

  function update(field, value) {
    setDraft((prev) => ({ ...prev, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    setFilters(draft);
  }

  function clear() {
    setDraft(emptyFilters);
    setFilters(emptyFilters);
  }

  return (
    <section className="panel">
      <h2>Incidentes</h2>
      <form className="filters" onSubmit={submit}>
        <select value={draft.status} onChange={(e) => update('status', e.target.value)}>
          <option value="">Estado: todos</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={draft.priority} onChange={(e) => update('priority', e.target.value)}>
          <option value="">Prioridad: todas</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input
          list="categorias"
          placeholder="Categoria"
          value={draft.category}
          onChange={(e) => update('category', e.target.value)}
        />
        <select
          value={draft.assigned_to}
          onChange={(e) => update('assigned_to', e.target.value)}
        >
          <option value="">Tecnico: todos</option>
          {TECHNICIANS.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <button type="submit">Filtrar</button>
        <button type="button" className="secondary" onClick={clear}>Limpiar</button>
      </form>
      <datalist id="categorias">
        {CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {error && <p className="error">{error}</p>}
      {incidents.length === 0 && !error ? (
        <p className="muted">No hay incidentes con estos filtros.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Titulo</th>
                <th>Categoria</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Tecnico</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((i) => (
                <tr
                  key={i.id}
                  className={i.id === selectedId ? 'selected' : ''}
                  onClick={() => onSelect(i.id)}
                >
                  <td>{i.id}</td>
                  <td>{i.title}</td>
                  <td>{i.category}</td>
                  <td><Badge kind="priority" value={i.priority} /></td>
                  <td><Badge kind="status" value={i.status} /></td>
                  <td>{i.assigned_to_name || '—'}</td>
                  <td>{formatDate(i.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/* ---------- Alta de incidente ---------- */
function IncidentForm({ currentUser, onCreated }) {
  const initial = { title: '', description: '', category: CATEGORIES[0], priority: 'MEDIA' };
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setOk('');
    try {
      const created = await api.createIncident({ ...form, created_by: currentUser });
      setOk(`Incidente #${created.id} creado correctamente.`);
      setForm(initial);
      onCreated(created.id);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="panel">
      <h2>Nuevo incidente</h2>
      <form className="form" onSubmit={submit}>
        <label>
          Titulo
          <input
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            maxLength={150}
            required
          />
        </label>
        <label>
          Descripcion
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            required
          />
        </label>
        <div className="row">
          <label>
            Categoria
            <input
              list="categorias"
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              maxLength={50}
              required
            />
          </label>
          <label>
            Prioridad
            <select value={form.priority} onChange={(e) => update('priority', e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit">Crear incidente</button>
      </form>
      {error && <p className="error">{error}</p>}
      {ok && <p className="ok">{ok}</p>}
    </section>
  );
}

/* ---------- Detalle, asignacion, estado e historial (Task 22) ---------- */
function IncidentDetail({ id, currentUser, onChanged, onClose }) {
  const [incident, setIncident] = useState(null);
  const [comments, setComments] = useState([]);
  const [technician, setTechnician] = useState(String(TECHNICIANS[0].id));
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [inc, com] = await Promise.all([api.getIncident(id), api.listComments(id)]);
      setIncident(inc);
      setComments(com);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action) {
    try {
      setError('');
      await action();
      await load();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  async function sendComment(event) {
    event.preventDefault();
    await run(async () => {
      await api.addComment(id, currentUser, text);
      setText('');
    });
  }

  if (!incident) {
    return (
      <section className="panel">
        {error ? <p className="error">{error}</p> : <p className="muted">Cargando...</p>}
      </section>
    );
  }

  const canAssign = incident.status !== 'RESUELTO' && incident.status !== 'CERRADO';
  const nextStatuses = NEXT_STATUSES[incident.status] || [];

  return (
    <section className="panel">
      <div className="detail-head">
        <h2>#{incident.id} — {incident.title}</h2>
        <button className="secondary" onClick={onClose}>Cerrar</button>
      </div>
      <p>{incident.description}</p>
      <p className="meta">
        <Badge kind="status" value={incident.status} />{' '}
        <Badge kind="priority" value={incident.priority} /> · {incident.category} · creado por{' '}
        {incident.created_by_name} el {formatDate(incident.created_at)} · tecnico:{' '}
        {incident.assigned_to_name || 'sin asignar'}
      </p>

      {error && <p className="error">{error}</p>}

      <div className="actions">
        {canAssign && (
          <div className="inline">
            <select value={technician} onChange={(e) => setTechnician(e.target.value)}>
              {TECHNICIANS.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button onClick={() => run(() => api.assign(id, Number(technician)))}>
              Asignar tecnico
            </button>
          </div>
        )}
        {nextStatuses.map((s) => (
          <button key={s} onClick={() => run(() => api.changeStatus(id, s))}>
            Pasar a {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <h3>Historial de comentarios</h3>
      {comments.length === 0 ? (
        <p className="muted">Aun no hay comentarios.</p>
      ) : (
        <ul className="comments">
          {comments.map((c) => (
            <li key={c.id}>
              <strong>{c.author_name}</strong>{' '}
              <span className="muted">{formatDate(c.created_at)}</span>
              <p>{c.body}</p>
            </li>
          ))}
        </ul>
      )}
      <form className="form" onSubmit={sendComment}>
        <textarea
          rows={3}
          placeholder="Escribe un comentario..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={2000}
          required
        />
        <button type="submit">Agregar comentario</button>
      </form>
    </section>
  );
}

/* ---------- Dashboard (Task 33) ---------- */
function BarList({ title, items, labelKey }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="card">
      <h3>{title}</h3>
      {items.length === 0 && <p className="muted">Sin datos.</p>}
      {items.map((item) => (
        <div className="bar-row" key={item[labelKey]}>
          <span className="bar-label">{item[labelKey]}</span>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
          <span className="bar-count">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function Dashboard({ refreshKey }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api
      .dashboard()
      .then((d) => active && setData(d))
      .catch((err) => active && setError(err.message));
    return () => {
      active = false;
    };
  }, [refreshKey]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Cargando...</p>;

  return (
    <section className="panel">
      <h2>Dashboard</h2>
      <div className="stats">
        <div className="stat"><span>{data.total}</span>Total</div>
        <div className="stat"><span>{data.open}</span>Abiertos</div>
        <div className="stat"><span>{data.closed}</span>Cerrados</div>
        <div className="stat critical"><span>{data.critical}</span>Criticos abiertos</div>
      </div>
      <div className="cards">
        <BarList title="Por estado" items={data.byStatus} labelKey="status" />
        <BarList title="Por categoria" items={data.byCategory} labelKey="category" />
        <BarList title="Abiertos por tecnico" items={data.byTechnician} labelKey="name" />
      </div>
    </section>
  );
}

/* ---------- Aplicacion ---------- */
export default function App() {
  const [view, setView] = useState('incidentes');
  const [selectedId, setSelectedId] = useState(null);
  const [currentUser, setCurrentUser] = useState(USERS[0].id);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="app">
      <header>
        <h1>IT Incident Hub</h1>
        <nav>
          {[
            ['incidentes', 'Incidentes'],
            ['nuevo', 'Nuevo incidente'],
            ['dashboard', 'Dashboard'],
          ].map(([key, label]) => (
            <button
              key={key}
              className={view === key ? 'tab active' : 'tab'}
              onClick={() => setView(key)}
            >
              {label}
            </button>
          ))}
        </nav>
        <label className="user-select">
          Actuando como
          <select value={currentUser} onChange={(e) => setCurrentUser(Number(e.target.value))}>
            {USERS.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </label>
      </header>

      <main>
        {view === 'incidentes' && (
          <>
            <IncidentList
              refreshKey={refreshKey}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
            {selectedId && (
              <IncidentDetail
                key={selectedId}
                id={selectedId}
                currentUser={currentUser}
                onChanged={refresh}
                onClose={() => setSelectedId(null)}
              />
            )}
          </>
        )}
        {view === 'nuevo' && (
          <IncidentForm
            currentUser={currentUser}
            onCreated={(id) => {
              refresh();
              setSelectedId(id);
              setView('incidentes');
            }}
          />
        )}
        {view === 'dashboard' && <Dashboard refreshKey={refreshKey} />}
      </main>
    </div>
  );
}