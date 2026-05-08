// Shared types and utilities for BeigeBoard

// Todo type

class Todo {

  constructor(id, title, completed = false, createdAt = new Date()) {

    this.id = id;

    this.title = title;

    this.completed = completed;

    this.createdAt = createdAt;

  }

}

module.exports = { Todo };