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

/**
 * Endpoint that returns a succes or fail to update message
 */
app.post("/updatePhone", async function(req, res) {
  try {
    let content = await updatePhone(req.body.phoneId, req.body.update, req.body.value);
    res.type("text");
    res.send(content);
  } catch (error) {
    res.type("text");
    res.send(error);
  }
});

/**
 * Updates the database with the new information
 * @param {int} phoneId - The id of the phone
 * @param {string[]} updates - The attributes to update
 * @param {object[]} values - The values to the corresponding attributes
 */
async function updatePhone(phoneId, updates, values) {
  try {
    let database = await getDBConnection();
    for (let i = 0; i < updates.length; i++) {
      let query = "UPDATE phones SET " + updates[i] + " WHERE phone_id=?;";
      await database.all(query, [values[i], phoneId]);
    }
    database.close();
    return "Updated succesfully";
  } catch (error) {
    return "Failed to update, try again later";
  }
}

/**
 * Endpoint that returns all of the parts and their id's for a given phone model
 */
app.get("/allParts", async function(req, res) {
  try {
    let content = await getModelParts(req.query.model);
    res.json(content);
  } catch (error) {
    res.type("text");
    res.send(error);
  }
});

/**
 * Gets the parts and part id's of the given phone model from the database
 * @param {string} model - The model of the phone
 */
async function getModelParts(model) {
  try {
    let query = "SELECT part_id, part_name FROM parts WHERE model_id =?";
    let database = await getDBConnection();
    let content = await database.all(query, [model]);
    database.close();
    return content;
  } catch (error) {
    console.error(error);
  }

}

/**
 * Endpoint that returns names of parts and their id based on their part id
 */
app.post("/phoneParts", async function(req, res) {
  try {
    let content = await getPartNames(req.body.parts);
    res.json(content);
  } catch (error) {
    res.type("text");
    res.send(error);
  }
});

/**
 * Returns json array of all the parts
 * @param {int[]} partsList - int array where the int maps to the part id in the database
 * @return {json} - Array of strings of the names of the parts
 */
async function getPartNames(partsList) {
  try {
    let query = "SELECT part_name FROM parts WHERE part_id =?;";
    let database = await getDBConnection();
    let parts = [];
    for (let i = 0; i < partsList.length; i++) {
      let part = await database.all(query, [partsList[i].toString()]);
      let test1 = partsList[i];
      let partName = part[0];
      parts.push({"part": {"part_id": test1, "part_name": partName}});
    }
    database.close();
    return parts;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Endpoint that gets specific information from the database of just one phone
 */
app.post("/phoneInfo", async function(req, res) {
  try {
    let content = await getPhoneInfo(req.body.phone_id);
    res.json(content[0]);
  } catch (error) {
    res.type("text");
    res.send(error);
  }
});

/**
 * Gets the information on the specified phone
 * @param {int} phoneId - The id of the phone in the database
 * @return {json} - JSON formatted information
 */
async function getPhoneInfo(phoneId) {
  try {
    let query = "SELECT * FROM phones WHERE phone_id =?;";
    let database = await getDBConnection();
    let content = await database.all(query, [phoneId]);
    database.close();
    return content;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Returns a string represnetation of a double of the cost of all the parts ever purchased
 */
app.post("/partsCost", async function(req, res) {
  try {
    let content = await getPartsCost(req.body.parts);
    res.type("text");
    res.send(content);
  } catch (error) {
    res.type("text");
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
    let total = 0.00;
    for (let i = 0; i < partsList.length; i += 2) {
      let query = "SELECT part_cost FROM parts WHERE part_id =?;";
      let partPrice = await database.all(query, [partsList[i].toString()]);
      if (partPrice[0] !== undefined) {
        total = total + partPrice[0].part_cost;
      }
    }
    database.close();
    return total.toFixed(2).toString();
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