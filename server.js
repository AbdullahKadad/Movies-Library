const express = require("express");
const app = express();
const port = 3000;
const data = require("./MovieData/data.json");

app.get("/", homePage);
app.get("/favorite", favoritePage);

function homePage(req, res) {
  let move = new Move(data.title, data.poster_path, data.overview);
  res.json(move);
}

// Move constructor
function Move(title, poster_path, overview) {
  this.title = title;
  this.poster_path = poster_path;
  this.overview = overview;
}

function favoritePage(req, res) {
  res.send("Welcome to Favorite Page");
}

// 500 error
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 500,
    responseText: "Sorry, something went wrong",
  });
});

// 404 error
app.use((req, res, next) => {
  res.status(404).json({
    status: 404,
    responseText: "Page not found",
  });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
