import React, { useState, useEffect } from 'react';

import axios from 'axios';

import './App.css';

function App() {

  const [todos, setTodos] = useState([]);

  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {

    fetchTodos();

  }, []);

  const fetchTodos = async () => {

    const response = await axios.get('http://localhost:3000/todos');

    setTodos(response.data);

  };

  const addTodo = async () => {

    if (newTodo.trim()) {

      await axios.post('http://localhost:3000/todos', { title: newTodo });

      setNewTodo('');

      fetchTodos();

    }

  };

  const toggleTodo = async (id, completed) => {

    await axios.put(`http://localhost:3000/todos/${id}`, { completed: !completed });

    fetchTodos();

  };

  return (

    <div className="App">

      <header className="App-header">

        <h1>BeigeBoard</h1>

        <div>

          <input

            type="text"

            value={newTodo}

            onChange={(e) => setNewTodo(e.target.value)}

            placeholder="Add a todo"

          />

          <button onClick={addTodo}>Add</button>

        </div>

        <ul>

          {todos.map(todo => (

            <li key={todo.id} onClick={() => toggleTodo(todo.id, todo.completed)} style={{ textDecoration: todo.completed ? 'line-through' : 'none' }}>

              {todo.title}

            </li>

          ))}

        </ul>

      </header>

    </div>

  );

}

export default App;