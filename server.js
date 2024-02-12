"use strict";
// NPM things //
const express = require("express");
const app = express();
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// DataBase things //
const { Client } = require("pg");
const url = `postgres://${process.env.DBNAME || "student"}:${
  process.env.DMPASSWORD || "00000111"
}@localhost:5432/movies`;
const client = new Client(url);

// PORT //
const port = process.env.PORT || 3000;

// Json Data //
const data = require("./MovieData/data.json");

// API //
const apiKey = process.env.API_KEY;
// API endpoints //
const trendingMovies =
  "https://api.themoviedb.org/3/trending/all/week?language=en-US&api_key=";
const searchMovies = "https://api.themoviedb.org/3/search/movie?api_key=";
const discoverMovies = "https://api.themoviedb.org/3/discover/movie?api_key=";
const playingMovies = "https://api.themoviedb.org/3/movie/now_playing?api_key=";

// routes //
app.get("/", homeHandler);
app.get("/favorite", favoriteHandler);
app.get("/trending", trendingHandler);
app.get("/search", searchHandler);
app.get("/discover", discoverHandler);
app.get("/playingNow", playingNowHandler);
app.post("/addMovie", addMovieHandler);
app.get("/getMovies/:id?", getMoviesHandler);
app.patch("/UPDATE/:id/comments", updataHandler);
app.delete("/DELETE/:id", deleteHandler);

// Handlers //
//Home
function homeHandler(req, res) {
  let move = new Move(data.title, data.poster_path, data.overview);
  res.json(move);
}
//favorite
function favoriteHandler(req, res) {
  res.send("Welcome to Favorite Page");
}
//trending
function trendingHandler(req, res) {
  axios
    .get(`${trendingMovies}${apiKey}`)
    .then((result) => {
      res.json(reshape(result.data.results));
    })
    .catch((e) => {
      console.log(e.stack);
      res.status(500).send("Internal Server Error");
    });
}
//search
function searchHandler(req, res) {
  const title = req.query.title;
  axios
    .get(`${searchMovies}${apiKey}&query=${title}`)
    .then((result) => {
      res.json(reshape(result.data.results));
    })
    .catch((e) => {
      console.log(e.stack);
      res.status(500).send("Internal Server Error");
    });
}
//discover
function discoverHandler(req, res) {
  const year = req.query.year;
  axios
    .get(`${discoverMovies}${apiKey}&primary_release_year=${year}`)
    .then((result) => {
      res.json(reshape(result.data.results));
    })
    .catch((e) => {
      console.log(e.stack);
      res.status(500).send("Internal Server Error");
    });
}
//playingNow
function playingNowHandler(req, res) {
  axios
    .get(`${playingMovies}${apiKey}`)
    .then((result) => {
      res.json(reshape(result.data.results));
    })
    .catch((e) => {
      console.log(e.stack);
      res.status(500).send("Internal Server Error");
    });
}
//addMovie
function addMovieHandler(req, res) {
  const { title, release_date, poster_path, overview, comments } = req.body;
  const query = `INSERT INTO data (title, release_date, poster_path, overview, comments)
  VALUES ($1, $2, $3, $4, $5) RETURNING *;`;
  const values = [title, release_date, poster_path, overview, comments];
  client
    .query(query, values)
    .then((result) => {
      res.status(201).send(`Movie Saved Successfully`);
    })
    .catch((e) => {
      console.log(e.stack);
      res.status(500).send("Internal Server Error");
    });
}
//getMovies
function getMoviesHandler(req, res) {
  const { id } = req.params;
  if (id) {
    const query = `SELECT * FROM data WHERE id = $1`;
    client
      .query(query, [id])
      .then((result) => {
        if (result.rows.length !== 0) {
          res.status(200).json(result.rows);
        } else {
          res.status(404).send("Movie not found");
        }
      })
      .catch((e) => {
        console.error(e.stack);
        res.status(500).send("Internal Server Error");
      });
  } else {
    const query = `SELECT * FROM data`;
    client
      .query(query)
      .then((result) => {
        res.status(200).json(result.rows);
      })
      .catch((e) => {
        console.error(e.stack);
        res.status(500).send("Internal Server Error");
      });
  }
}
//UPDATE
function updataHandler(req, res) {
  const id = req.params.id;
  const { comments } = req.body;
  const query = `UPDATE data SET comments = $1 WHERE id = $2;`;
  const values = [comments, id];
  client
    .query(query, values)
    .then(() => {
      res.status(200).send(`Movie updated Successfully`);
    })
    .catch((e) => {
      console.log(e.stack);
      res.status(500).send("Internal Server Error");
    });
}
//DELETE
function deleteHandler(req, res) {
  const id = req.params.id;
  const selectQuery = `SELECT * FROM data WHERE id = $1;`;
  const query = `DELETE FROM data WHERE id = $1;`;
  const values = [id];
  client
    .query(selectQuery, values)
    .then((result) => {
      if (result.rows.length !== 0) {
        client
          .query(query, values)
          .then(() => {
            res.status(204).send(`Movie deleted Successfully`);
          })
          .catch((e) => {
            console.log(e.stack);
            res.status(500).send("Internal Server Error");
          });
      } else {
        return res.status(404).json({ error: "Movie not found." });
      }
    })
    .catch((e) => {
      console.log(e.stack);
      res.status(500).send("Internal Server Error");
    });
}

// functions //
function reshape(array) {
  let data = [];
  array.forEach((element) => {
    data.push(
      new APIMove(
        element.id,
        element.title,
        element.release_date,
        element.poster_path,
        element.overview
      )
    );
  });
  return data;
}

// Move constructor //
function Move(title, poster_path, overview) {
  this.title = title;
  this.poster_path = poster_path;
  this.overview = overview;
}

// API Move constructor //
function APIMove(id, title, release_date, poster_path, overview) {
  this.id = id;
  this.title = title;
  this.release_date = release_date;
  this.poster_path = poster_path;
  this.overview = overview;
}

// 500 error //
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 500,
    responseText: "Sorry, something went wrong",
  });
});

// 404 error //
app.use((req, res, next) => {
  res.status(404).json({
    status: 404,
    responseText: "Page not found",
  });
});

// listener //
client
  .connect()
  .then(() => {
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  })
  .catch((e) => {
    console.log(e.stack);
    res.status(500).send("Internal Server Error");
  });
