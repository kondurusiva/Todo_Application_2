const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const addDays = require("date-fns/addDays");
const app = express();
let db = null;

app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");
initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const hasStatusAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasCategoryAndStatusProperty = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  const { category, status, priority, search_q = "" } = request.query;
  let getsQuery = "";
  let data = null;
  switch (true) {
    case hasStatusAndPriorityProperties(request.query):
      getsQuery = `
        SELECT 
            * 
        FROM 
            todo 
        WHERE 
            status='${status}' AND priority='${priority}' AND todo LIKE '%${search_q}%';`;
      break;
    case hasPriorityProperty(request.query):
      getsQuery = `
        SELECT 
            *
        FROM 
            todo
        WHERE
            priority='${priority}' AND todo LIKE '%${search_q}%';`;
      break;
    case hasStatusProperty(request.query):
      getsQuery = `
        SELECT 
            *
        FROM 
            todo
        WHERE
            todo LIKE '%${search_q}%' AND status='${status}';`;
      break;
    case hasCategoryAndStatusProperty(request.query):
      getQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            todo LIKE '%${search_q}%' AND 
            status='${status}' AND 
            priority='${priority}';`;
      break;
    case hasCategoryProperty(request.query):
      getQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            todo LIKE '%${search_q}%' AND 
            category='${category}';`;
      break;
    case hasCategoryAndPriorityProperty(request.query):
      getQuery = `
          SELECT
            *
          FROM
            todo
          WHERE
            todo LIKE '%${search_q}%' AND 
            category='${category}' AND 
            priority='${priority}';`;
      break;
    default:
      getsQuery = `
            SELECT
                *
            FROM
                todo
            WHERE
                todo LIKE '%${search_q}%';`;
  }
  data = await db.all(getsQuery);
  response.send(data);
});

// API 2
app.get(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  const idQuery = `
  SELECT
    *
  FROM
    todo
  WHERE
    id=${todoId};`;
  const idBased = await db.get(idQuery);
  response.send(idBased);
});

//API 3
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status)
  VALUES
    (${id},'${todo}', '${priority}', '${status}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

//API 4
app.put(`/todos/:todoId/`, async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status Updated";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority Updated";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo Updated";
      break;
  }
  const BeforeQuery = `
  SELECT 
    *
  FROM
    todo
  WHERE 
    id=${todoId};`;
  const BeforeTodo = await db.get(BeforeQuery);

  const {
    todo = BeforeTodo.todo,
    priority = BeforeTodo.priority,
    status = BeforeTodo.status,
  } = request.body;

  const updateQuery = `
  UPDATE 
    todo
  SET 
    todo='${todo}',
    priority='${priority}',
    status='${status}'
  WHERE
    id=${todoId};`;
  await db.run(updateQuery);
  response.send(updateColumn);
});

//API 5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteQuery = `DELETE FROM todo WHERE id=${todoId};`;
  await db.run(deleteQuery);
  response.send("Todo Deleted");
});

module.exports = app;
