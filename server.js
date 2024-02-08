"use strict";
const express = require("express");
const app = express();
const data = require("./MovieData/data.json");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");
const { Client } = require("pg");
const url = `postgres://student:00000111@localhost:5432/movies`;
const client = new Client(url);
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const port = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;
const trendingMovies =
  "https://api.themoviedb.org/3/trending/all/week?language=en-US&api_key=";
const searchMovies = "https://api.themoviedb.org/3/search/movie?api_key=";
const discoverMovies = "https://api.themoviedb.org/3/discover/movie?api_key=";
const playingMovies = "https://api.themoviedb.org/3/movie/now_playing?api_key=";

// routes
app.get("/", homeHandler);
app.get("/favorite", favoriteHandler);
app.get("/trending", trendingHandler);
app.get("/search", searchHandler);
app.get("/discover", discoverHandler);
app.get("/playingNow", playingNowHandler);
app.post("/addMovie", addMovieHandler);
app.get("/getMovies", getMoviesHandler);

// Handlers
function homeHandler(req, res) {
  let move = new Move(data.title, data.poster_path, data.overview);
  res.json(move);
}

function favoriteHandler(req, res) {
  res.send("Welcome to Favorite Page");
}

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

function addMovieHandler(req, res) {
  const { id, title, release_date, poster_path, overview, comments } = req.body;
  const query = `INSERT INTO Data (id, title, release_date, poster_path, overview, comments)
  VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;`;
  const values = [id, title, release_date, poster_path, overview, comments];
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

function getMoviesHandler(req, res) {
  const query = `SELECT * FROM data`;
  client
    .query(query)
    .then((result) => {
      const data = result.rows;
      res.json(data);
    })
    .catch((e) => {
      console.log(e.stack);
      res.status(500).send("Internal Server Error");
    });
}

// functions
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

// Move constructor
function Move(title, poster_path, overview) {
  this.title = title;
  this.poster_path = poster_path;
  this.overview = overview;
}

// API Move constructor
function APIMove(id, title, release_date, poster_path, overview) {
  this.id = id;
  this.title = title;
  this.release_date = release_date;
  this.poster_path = poster_path;
  this.overview = overview;
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

// listener
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
