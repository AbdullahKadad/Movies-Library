"use strict";
const express = require("express");
const app = express();
const data = require("./MovieData/data.json");
const axios = require("axios");
require("dotenv").config();

const port = process.env.PORT;
const apiKey = process.env.API_KEY;
const trendingMovies =
  "https://api.themoviedb.org/3/trending/all/week?language=en-US&api_key=";
const searchMovies = "https://api.themoviedb.org/3/search/movie?api_key=";
const discoverMovies = "https://api.themoviedb.org/3/discover/movie?api_key=";
const playingMovies = "https://api.themoviedb.org/3/movie/now_playing?api_key=";

// routes
app.get("/", homePage);
app.get("/favorite", favoritePage);
app.get("/trending", trendingPage);
app.get("/search", searchPage);
app.get("/discover", discoverPage);
app.get("/playingNow", playingNowPage);

// functions
function homePage(req, res) {
  let move = new Move(data.title, data.poster_path, data.overview);
  res.json(move);
}

function favoritePage(req, res) {
  res.send("Welcome to Favorite Page");
}

function trendingPage(req, res) {
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

function searchPage(req, res) {
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

function discoverPage(req, res) {
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

function playingNowPage(req, res) {
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

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
