import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './App.css';

import { ThemeCtx, LIGHT, DARK, isoDate, API } from './theme';
import { Halation, FilmGrain, Artifacts, ScanLines, FilmStripNav, DarkModeToggle, CinematicIntro } from './overlays';
import { AppHeader } from './components/AppHeader';
import { TodayView } from './views/TodayView';
import { CalendarView } from './views/CalendarView';
import { TasksView } from './views/TasksView';

export default function App() {
  const [todos,   setTodos]   = useState([]);
  const [view,    setView]    = useState('today');
  const [error,   setError]   = useState(null);
  const [dark,    setDark]    = useState(true);
  const [intro,   setIntro]   = useState(true);
  const [colorIn, setColorIn] = useState(false);
  const today = isoDate(new Date());
  const T = dark ? DARK : LIGHT;

  const loadTodos = useCallback(async () => {
    try {
      const r = await axios.get(`${API}/todos`);
      setTodos(r.data); setError(null);
    } catch {
      setError('Cannot reach backend on port 3000.');
    }
  }, []);

  useEffect(() => { loadTodos(); }, [loadTodos]);

  const ops = {
    today,
    add: async (title, dueDate, scheduledTime, parentId, scheduledEnd) => {
      if (!title.trim()) return;
      await axios.post(`${API}/todos`, {
        title: title.trim(),
        due_date: dueDate || null,
        scheduled_time: scheduledTime || null,
        scheduled_end: scheduledEnd || null,
        parent_id: parentId || null,
      });
      loadTodos();
    },
    toggle: async (id, completed) => {
      await axios.put(`${API}/todos/${id}`, { completed: !completed });
      loadTodos();
    },
    remove: async (id) => {
      await axios.delete(`${API}/todos/${id}`);
      loadTodos();
    },
    setDueDate: async (id, dueDate) => {
      await axios.put(`${API}/todos/${id}`, { due_date: dueDate || null });
      loadTodos();
    },
    setColor: async (id, color) => {
      await axios.put(`${API}/todos/${id}`, { color: color || null });
      loadTodos();
    },
    setTime: async (id, time, endTime) => {
      await axios.put(`${API}/todos/${id}`, { scheduled_time: time || null, scheduled_end: endTime || null });
      loadTodos();
    },
  };

  return (
    <ThemeCtx.Provider value={T}>
      {intro && <CinematicIntro onDone={() => { setIntro(false); setColorIn(true); }} />}

      <Halation />
      <FilmGrain />
      <ScanLines />
      <Artifacts />

      <div style={{
        filter: colorIn ? 'saturate(1) brightness(1)' : 'saturate(0.04) brightness(0.08)',
        transition: colorIn ? 'filter 1.6s ease-out' : 'none',
      }}>
        <div style={{ minHeight: '100vh', background: T.paper, color: T.ink, fontFamily: "'Inter Tight', system-ui, sans-serif", filter: 'url(#halation)' }}>
          <AppHeader view={view} today={today} />
          {error && (
            <div style={{
              background: T.paperDark, color: T.red,
              fontSize: 11, letterSpacing: '0.1em',
              padding: '8px 40px', borderBottom: `1px solid ${T.red}`,
            }}>
              {error} — start the backend: <code style={{ fontFamily: 'monospace' }}>node server.js</code>
            </div>
          )}
          <div key={view} className="view-enter">
            {view === 'today'    && <TodayView    todos={todos} ops={ops} setView={setView} />}
            {view === 'calendar' && <CalendarView todos={todos} ops={ops} />}
            {view === 'tasks'    && <TasksView    todos={todos} ops={ops} />}
          </div>
        </div>
      </div>

      <FilmStripNav view={view} setView={setView} />
      <DarkModeToggle dark={dark} onToggle={() => setDark(d => !d)} />
    </ThemeCtx.Provider>
  );
}
