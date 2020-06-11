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
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(multer().none());

/*app.post("/phoneInfo", function(req, res) {
  let phoneId = req.body.phone_id;
  let phoneInfo = getPhoneInfo(phoneId);
  // send back json
});*/

/**
 * Returns a string represnetation of a double of the cost of all the parts ever purchased
 */
app.post("/partsCost", async function(req, res) {
  try {
    let content = await getPartsCost(req.body.parts);
    res.type("text");
    res.send(content);
  } catch (error) {
    res.send("text");
    res.send(error);
  }
});

/**
 * Gets the total cost of all the parts based on the price list in the database
 * @param {int[]} partsList - The array of part ids
 * @return {string} - String representation of the total price
 */
async function getPartsCost(partsList) {
  try {
    let database = await getDBConnection();
    let total = 0.0;
    for (let i = 0; i < partsList.length; i++) {
      let query = "SELECT part_cost FROM parts WHERE part_id =?;";
      let partPrice = await database.all(query, [partsList[i].toString()]);
      total += partPrice;
    }
    return total;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Returns json information on all of the phones from the database
 */
app.get("/allPhones", async function(req, res) {
  try {
    let content = await getAllPhones(orderQuery(req.query.order));
    res.json(content);
  } catch (error) {
    res.type("text");
    res.send(error);
  }
});

/**
 * Asks the database for infomation and returns json
 * @param {string} order - An sql query fragment of how to order the phone data
 * @return {json} - Information on all of the phones
 */
async function getAllPhones(order) {
  try {
    let query = "SELECT * FROM phones ORDER BY " + order;
    let database = await getDBConnection();
    let content = await database.all(query);
    database.close();
    return content;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Helper method to choose which order to filter by
 * @param {int} order - Which position of the query array to choose from
 * @return {string} - A part of an sql query
 */
function orderQuery(order) {
  let orders = ["date_aquired DESC;", "date_aquired;", "model_id DESC;", "model_id;", "status;",
                  "status DESC;", "phone_cost;", "phone_cost DESC;"];
  return orders[order];
}

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