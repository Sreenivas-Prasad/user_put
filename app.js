const express = require("express");

const app = express();
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());
const bcrypt = require("bcrypt");
const dbpath = path.join(__dirname, "userData.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbpath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Govinda Govinda");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};
initializeDbAndServer();

app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  if (password.length < 5) {
    response.status(400);
    response.send("Password is too short");
  } else {
    const hashedPassword = await bcrypt.hash(password, 10);
    const createUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
    const dbUser = await db.get(createUserQuery);
    if (dbUser === undefined) {
      const createUserQuery = `INSERT INTO user (username, name, password, gender, location)
      VALUES ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}' )`;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("User already exists");
    }
  }
});

app.get("/", async (request, response) => {
  const getUserQuery = `SELECT * FROM user`;
  const userArray = await db.all(getUserQuery);
  response.send(userArray);
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const loginQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(loginQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;

  const loginQuery = `SELECT * FROM user WHERE username = '${username}'`;

  const dbUser = await db.get(loginQuery);

  if (dbUser === undefined) {
    response.status(400);

    response.send("Invalid user");
  } else {
    const isPass = await bcrypt.compare(oldPassword, dbUser.password);

    if (isPass === true) {
      if (newPassword.length < 5) {
        response.status(400);

        response.send("Password is too short");
      } else {
        const hashedPassword2 = await bcrypt.hash(newPassword, 10);

        const updatePassQuery = `UPDATE user SET 

    password = '${hashedPassword2}' WHERE username = '${username}'`;

        await db.run(updatePassQuery);

        response.status(200);

        response.send("Password updated");
      }
    } else {
      response.status(400);

      response.send("Invalid current password");
    }
  }
});

module.exports = app;
