redux-entity-store
=============

[![NPM version][npm-image]][npm-url]
[![Dependencies][dependencies]][npm-url]
[![Build status][travis-image]][travis-url]

ORM-like API to access Redux store state

### UNDER HEAVY DEVELOPMENT! Stay in touch.

## Why

In Redux your reducer can not change store state directly. Instead your write this:

```javascript
case EDIT_TODO:
    return {
      todos: this.todos.map(todo =>
          todo.id === action.payload.id ?
              Object.assign({}, todo, { text }) :
              todo
      )
    }
```

[ImmutableJS](https://facebook.github.io/immutable-js/) provides another approach to it. Beeing effective, it is still not readable:

```
case EDIT_TODO:
    return todos.map(t => {
        if (t.get('id') === action.payload.id) {
          return t.set('text', text);
        } else {
          return t;
        }
      });
```

In particular, it make you use ImmutableJS objects instead plain JS objects.

**Redux-entity-store** solves this by modelling store state as relational database and providing ORM-like API to access
it. Above example could be rewritten as:

```
case EDIT_TODO:
    const todo = session.todo.byId(id);
    todo.text = text;
```

(Session is an entry point to the API, will be discussed later).

Looks much simpler, right?

## Usage

NOTE: further code examples will be given using [redux-action-object.](https://github.com/vasyas/redux-action-object)

Your store state should contain property named 'data'. Part of the state tree, starting with data, will be managed by
redux-entity-store. Data is an object whose properties are tables. Each table is an array of objects called entities.
Each entity should have property named 'id'.


```javascript
class TodoModel {                                  // Initial state using redux-action-object
  data = {
    todo: [{
        id: 0,
        text: 'Use Redux',
        completed: false
    }]
  };
  ...
}
```

Those methods that wish to use *redux-entity-store* are annotated with *@entityStore.data* annotation. They will get an
extra argument 'session'. Session is an entry point to data API:

```
import * as entityStore from 'redux-entity-store';

class TodoModel {
  ...
  @entityStore.data
  edit(session, id, text) {                         // Reducer function
    const todo = session.todo.byId(id);
    todo.text = text;
  }
}
```

Bootstrap and UI code looks the same as in *redux-action-object*:

```
import * as actionObject from 'redux-action-object';

const { actionCreators, reducer } = actionObject.split(new TodoModel());

const store = createStore(reducer);
const actions = actionObject.bind(actionCreators, store.dispatch);

@connect(state => ({ todos: state.todos }))
class TodosComponent extends React.Component {
  handleSave(id, text) {
    actions.edit(id, text);
  }
}
```

## How it works

*Redux-entity-store* intercepts reducers functions annotated with *@data*. All entities retreived via *session* and modified
are put back into the store on return from the reducer.

## Binding UI components to entities

Usually you will want to bind to specific subset of data in your UI component. Memoized selectors using [Reselect](https://github.com/reactjs/reselect) provides handy and
fast method to do it. See example:

```javascript
import { createSelector, createStructuredSelector } from 'reselect';

const data = state => state.app.data;
const todos = createSelector(data, data => data.todos);

const selectedTodoId = (state, props) => props.params.id;
const selectedTodo = createSelector(todos, selectedTodoId, (todos, selectedTodoId) => (
    todos.filter(todo => todo.id == selectedTodoId)[0]
));

@connect(createStructuredSelector({
    selectedTodo
}))
class EditTodo extends React.Component {
  handleUpdate(id, text) {
    actions.edit(id, text);
  }
}
```

## Server side support

For certain projects Redux state can contain the same entities are as the server side. For such case, redux-entity-store
can generate requests for update server-side data.

FIXME write instructions

## Demo

Server part of the demo app requires Mysql to be installed. For the MacOS and Homebrew, use:

```
brew install mysql
mysql.server restart
```

then

```
mysql -u root
> create database todo;
> grant all privileges on todo.* to 'todo'@'localhost' identified by 'todo';
```

To start server part, use

```
npm run start:server
```

Then in a different terminal start frontend part

```
npm run start
```

Open [http://localhost:3000/](http://localhost:3000/) to access demo app.

All demo data will be saved into Mysql. You can data dump by opening [http://localhost:3001/data](http://localhost:3001/data).

## API Reference

## Alternatives

[npm-image]: https://img.shields.io/npm/v/redux-entity-store.svg?style=flat-square
[npm-url]: https://npmjs.org/package/redux-entity-store
[travis-image]: https://img.shields.io/travis/vasyas/redux-entity-store.svg?style=flat-square
[travis-url]: https://travis-ci.org/vasyas/redux-entity-store
[dependencies]: https://david-dm.org/vasyas/redux-entity-store.svg