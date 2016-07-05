/**
 * Package provide relational db-like access to Redux store.
 *
 * It is also supports updating server-side database
 */
import { sideEffect } from '../../actionObject/src/actionObject';

const RowUtils = {
  clone: function (row) {
    return Object.assign({}, row);
  },

  sameFields: function (a, b) {
    const aProps = Object.keys(a);
    const bProps = Object.keys(b);

    if (aProps.length != bProps.length) return false;

    for (let i = 0; i < aProps.length; i++) {
      const propName = aProps[i];

      if (a[propName] !== b[propName]) return false;
    }

    return true;
  }
};

function DataOp(type:String, table:String, fields:Map) {
  this.type = type;
  this.table = table;
  this.fields = fields;
}

DataOp.CREATE = 'CREATE';
DataOp.UPDATE = 'UPDATE';
DataOp.DELETE = 'DELETE';

function Table(rows, tableName) {
  let trackedRows = {};

  function tracked(row) {
    if (typeof row.id == 'undefined') throw 'Required property id is missing for ' + row;

    if (trackedRows[row.id])
      return trackedRows[row.id];

    const trackedRow = RowUtils.clone(row);
    trackedRows[row.id] = trackedRow;

    return trackedRow;
  }

  function byId(id) {
    return tracked(rows.find(row => row.id = id));
  }

  function filter(f = {}) {
    const predicate = row => {
      for (let key of Object.keys(f))
        if (f[key] != row[key])
          return false;

      return true;
    };

    return rows.filter(predicate).map(row => tracked(row));
  }

  function remove(row) {
    trackedRows[row.id] = null;
  }

  function create(newRow) {
    if (typeof newRow.id == 'undefined') throw 'Required property "id" is missing in ' + newRow;

    if (typeof trackedRows[newRow.id] != 'undefined') throw 'A row with id ' + newRow.id + ' already exist';

    for (const row of rows) {
      if (row.id == newRow.id)
        throw 'A row with id ' + newRow.id + ' already exist';
    }

    trackedRows[newRow.id] = newRow;
  }

  /** Return updated data */
  function commit() {
    let r = rows, ops = [];

    Object.keys(trackedRows).forEach(rowId => {
      const trackedRow = trackedRows[rowId];

      for (let i = 0; i < r.length; i++) {
        const row = r[i];

        if (row.id == rowId) {
          if (trackedRow == null) { // deleted
            if (r === rows) r = rows.slice(0); // create a copy

            r = r.slice(0, i).concat(r.slice(i + 1, r.length));
            ops.push(new DataOp(DataOp.DELETE, tableName, row));
            return;
          }

          if (!RowUtils.sameFields(row, trackedRow)) { // updated
            if (r === rows) r = rows.slice(0); // create a copy

            r = r.slice(0, i).concat([trackedRow], r.slice(i + 1, r.length));
            ops.push(new DataOp(DataOp.UPDATE, tableName, trackedRow));
            return;
          }

          // no changes made
          return;
        }
      }

      // no such row - created
      if (r === rows) r = rows.slice(0); // create a copy

      r.push(trackedRow);
      ops.push(new DataOp(DataOp.CREATE, tableName, trackedRow));
    });

    return { rows: r, ops };
  }

  return {
    commit, // private API (for session)
    byId, filter, remove, create // public API
  }
}

/**
 * Session can run either in connect or disconnected mode.
 *
 * In connected mode session keep tracks of all returned object. And if objects are updated, redux data state is updated.
 * In disconnected mode objects are not tracked.
 *
 * Disconnected mode is used for selectors. Connected mode required for reducers
 */
export function Session(data) {
  function createTables() {
    const r = {};

    for (let tableName of Object.keys(data))
      r[tableName] = new Table(data[tableName], tableName);

    return r;
  }

  function commit() {
    const dataUpdates = {}, mergedOps = [];

    for (let tableName of Object.keys(data)) {
      const { rows, ops } = tables[tableName].commit();

      if (rows !== data[tableName])
        dataUpdates[tableName] = rows;

      mergedOps.push(...ops);
    }

    return { dataUpdates, ops: mergedOps };
  }

  const tables = createTables();

  return {
    commit,
    ...tables
  }
}

export const REMOTE_BEGIN = {
  type: '@@Restore/BEGIN'
};

export const REMOTE_END = {
  type: '@@Restore/END'
};

export const REMOTE_FAIL = {
  type: '@@Restore/FAIL'
};

function confirmSuccessResponse(response) {
  if (response.status == 200) return response;

  let error = new Error(response.statusText);
  error.response = response;
  throw error;
}

/**
 * Mark reducer action impl as data, so it would be wrapped in restore.Sesssion call
 * To be used with actionObject
 *
 * ActionObject should have item name data
 */
export function data(target, name, descriptor) {
  const action = descriptor.value;

  return {
    configurable: true,
    get() {
      // what for this?
      if (this === target.prototype || this.hasOwnProperty(name))
        return action;

      function actionWrapper(...args) {
        if (typeof this.data == 'undefined') throw 'State do not have "data" property';

        const session = new Session(this.data);

        const ret = action.apply(this, [session, ...args]) || {}; // save return in case actionImpl will change smth besides data

        const { dataUpdates, ops } = session.commit();

        if (Object.keys(dataUpdates).length > 0) {
          ret.data = Object.assign({}, this.data, dataUpdates);

          sideEffect(function(dispatch) {
            dispatch(REMOTE_BEGIN);

            return fetch('/data', {
              method: 'POST',
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(ops)
            })
            .then(confirmSuccessResponse)
            .then(response => dispatch(REMOTE_END))
            .catch(e => dispatch(REMOTE_FAIL));
          });
        }

        return ret;
      }

      // what for this?
      Object.defineProperty(this, name, {
        value: actionWrapper,
        configurable: true,
        writable: true
      });

      return actionWrapper;
    }
  };
}

/** Load initial data into state */
export async function loadData(model) {
  return fetch('/data', {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  }).then(r => {
    return r.json();
  }).then(data => {
    model.data = data;
  });
}