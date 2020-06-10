/**
 * Developer: Samuel Affolder
 * Date: 06/07/2020
 *
 * Backend that keeps track of different players and stores game state in a database.
 */
"use strict";

const express = require("express");
const multer = require("multer");
const sqlite3 = require("sqlite3");
const sqlite = require("sqlite");
const LOCAL_HOST = 8000;

const app = express();
app.use(express.static("public", {index: "bestreads.html"}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(multer().none());

/**
 * Establishes a database connection to the wpl database and returns the database object.
 * Any errors that occur during connection should be caught in the function
 * that calls this one.
 * @returns {Object} - The database object for the connection.
 */
async function getDBConnection() {
  const database = await sqlite.open({
    filename: "parts.db",
    driver: sqlite3.Database
  });
  return database;
}

const PORT = process.env.PORT || LOCAL_HOST;
app.listen(PORT);