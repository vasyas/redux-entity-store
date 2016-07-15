import Application from 'koa';
import route from 'koa-route';
import logger from 'koa-logger';
import bodyParser from 'koa-bodyparser';
import json from 'koa-json';
import mysql from 'promise-mysql';

const app = new Application();

app.use(logger());
app.use(bodyParser());
app.use(json());

app.use(route.get('/data', getData));
app.use(route.post('/data', updateData));

const pool = mysql.createPool({
  host: 'localhost',
  user: 'todo',
  password: 'todo',
  database: 'todo',
  connectionLimit: 10
});

async function getData() {
  this.body = {
    todo: await pool.query('select * from todo')
  };

  this.status = 200;
}

async function updateQuery(con, op) {
  let q = '',
    values = [];

  for (const fieldName in op.fields) {
    if (q != '') q = q + ',';
    q = q + ` ${fieldName} = ?`;
    values.push(op.fields[fieldName]);
  }

  q = `update ${op.table} set` + q;

  await con.query(q, values);
}

async function createQuery(con, op) {
  let fields = [],
      valuePlaceholders = [],
      values = [];

  for (const fieldName in op.fields) {
    valuePlaceholders.push('?');
    fields.push(fieldName);
    values.push(op.fields[fieldName]);
  }

  const q = `insert into ${op.table}(${fields.join(',')}) values(${valuePlaceholders.join(',')})`;

  await con.query(q, values);
}

async function deleteQuery(con, op) {
  const q = `delete from ${op.table} where id = ?`;

  await con.query(q, [op.fields.id]);
}

async function updateData() {
  const con = await pool.getConnection();

  con.beginTransaction();

  try {
    for (const op of this.request.body) {
      switch(op.type) {
        case 'UPDATE':
          await updateQuery(con, op);
          break;

        case 'CREATE':
          await createQuery(con, op);
          break;

        case 'DELETE':
          await deleteQuery(con, op);
          break;
      }
    }

    con.commit();
  } catch(e) {
    con.rollback();
    throw e;
  }

  this.status = 200;
  this.body = 'Ok';
}

function startServer() {
  return new Promise((resolve, reject) => {
    app.listen(3001, error => {
      if (error)
        reject(error);
      else {
        console.info('Server started on port 3001'); // eslint-disable-line no-console
        resolve();
      }
    });
  });
}

async function initDb() {
  const tables = await pool.query('show tables');
  if (tables.length == 0) {
    await pool.query('create table todo (id varchar(24) primary key, `text` text, completed bool)')
  }
}

(async function() {
  try {
    await initDb();
    await startServer();
  } catch(e) {
    console.log(e.stack); // eslint-disable-line no-console
  }
})();

