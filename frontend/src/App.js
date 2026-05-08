import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await axios.get('http://localhost:3000/todos');
      setTodos(response.data);
      setError(null);
    } catch {
      setError('CANNOT REACH BACKEND — IS SERVER RUNNING?');
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;
    try {
      await axios.post('http://localhost:3000/todos', { title: newTodo.trim() });
      setNewTodo('');
      fetchTodos();
    } catch {
      setError('FAILED TO RECORD TASK');
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      await axios.put(`http://localhost:3000/todos/${id}`, { completed: !completed });
      fetchTodos();
    } catch {
      setError('FAILED TO UPDATE TASK');
    }
  };

  const deleteTodo = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/todos/${id}`);
      fetchTodos();
    } catch {
      setError('FAILED TO DELETE TASK');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') addTodo();
  };

  const filtered = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'done') return t.completed;
    return true;
  });

  const doneCount = todos.filter(t => t.completed).length;
  const isAllDone = todos.length > 0 && doneCount === todos.length;

  return (
    <div className="app">
      <div className="cassette-shell">

        <div className="cassette-header">
          <div className="reel">
            <div className="reel-spokes">
              {[0, 60, 120, 180, 240, 300].map(deg => (
                <div key={deg} className="spoke" style={{ transform: `rotate(${deg}deg)` }} />
              ))}
            </div>
            <div className="reel-hub" />
          </div>

          <div className="cassette-label">
            <div className="label-text">BeigeBoard</div>
            <div className="label-sub">SIDE A &nbsp;◆&nbsp; {doneCount}/{todos.length} COMPLETE</div>
            <div className="label-lines">
              <div className="label-line" />
              <div className="label-line" />
              <div className="label-line short" />
            </div>
          </div>

          <div className="reel">
            <div className="reel-spokes">
              {[0, 60, 120, 180, 240, 300].map(deg => (
                <div key={deg} className="spoke" style={{ transform: `rotate(${deg}deg)` }} />
              ))}
            </div>
            <div className="reel-hub" />
          </div>
        </div>

        <div className="tape-slot">
          <div className="tape-line" />
        </div>

        <div className="tape-window">
          <div className="scanlines" />

          {error && (
            <div className="error-banner">{error}</div>
          )}

          <div className="input-row">
            <input
              className="tape-input"
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="► NEW TASK..."
              maxLength={80}
            />
            <button className="btn-rec" onClick={addTodo}>
              <span className="rec-dot" />
              REC
            </button>
          </div>

          <div className="filter-row">
            {['all', 'active', 'done'].map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>

          <ul className="todo-list">
            {filtered.length === 0 && (
              <li className="empty-state">
                {filter === 'done' ? '— NO COMPLETED TASKS —' : '— TAPE IS BLANK —'}
              </li>
            )}
            {filtered.map(todo => (
              <li key={todo.id} className={`todo-item ${todo.completed ? 'done' : ''}`}>
                <button
                  className="check-btn"
                  onClick={() => toggleTodo(todo.id, todo.completed)}
                  title={todo.completed ? 'Mark active' : 'Mark done'}
                >
                  {todo.completed ? '■' : '□'}
                </button>
                <span className="todo-title">{todo.title}</span>
                <button
                  className="delete-btn"
                  onClick={() => deleteTodo(todo.id)}
                  title="Delete"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="cassette-footer">
          <span className="transport-btn">◀◀</span>
          <span className="transport-btn">◀</span>
          <span className={`transport-btn play ${isAllDone ? 'stopped' : 'playing'}`}>
            {isAllDone ? '■' : '▶'}
          </span>
          <span className="transport-btn">▶</span>
          <span className="transport-btn">▶▶</span>
        </div>

      </div>
    </div>
  );
}

export default App;
