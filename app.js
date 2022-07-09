const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
const path = require("path");
const format = require("date-fns");
const databasePath = path.join(__dirname, "todoApplication.db");
let dataBase = null;
app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    dataBase = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const hasStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};
const hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategory = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getQuery = "";
  const {
    search_q = "",
    priority,
    status,
    category,
    date = "",
  } = request.query;

  switch (true) {
    case hasStatus(request.query):
      getQuery = `
          select 
            *
          from todo
          where 
          todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    case hasPriority(request.query):
      getQuery = `
        select * 
        from todo
        where
        todo Like '%${search_q}%'
        And priority = '${priority}';`;
      break;
    case hasPriorityAndStatus(request.query):
      getQuery = `
        select * 
        from todo
        where
        todo Like '%${search_q}%'
        And priority = '${priority}'
        And status='${status}';`;
      break;
    case hasCategory(request.query):
      getQuery = `
        select * 
        from todo
        where
        todo Like '%${search_q}%'
        And category= '${category}';`;
      break;
    case hasCategoryAndStatus(request.query):
      getQuery = `
        select * 
        from todo
        where
        todo Like '%${search_q}%'
        And category= '${category}'
        And status='${status}';`;
      break;
    case hasCategoryAndPriority(request.query):
      getQuery = `
        select * 
        from todo
        where
        todo Like '%${search_q}%'
        And category= '${category}'
        And priority='${priority}';`;
      break;
    default:
      getQuery = `
        select * 
        from todo
        where
        todo Like '%${search_q}%';`;
      break;
  }
  data = await dataBase.all(getQuery);
  response.send(data);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const userQuery = `select * from todo where id=${todoId}`;
  const data = await dataBase.all(userQuery);
  response.send(data);
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const userQuery = `insert into todo(id, todo, priority, status, category, due_date) 
  values(${id}, '${todo}', '${priority}', '${status}', '${category}', ${dueDate});`;
  await dataBase.run(userQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await dataBase.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    due_date = previousTodo.due_date,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date=${due_date}
    WHERE
      id = ${todoId};`;

  await dataBase.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await dataBase.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
