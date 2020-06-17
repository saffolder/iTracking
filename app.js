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
app.use(express.static("public", {index: "indexTemp.html"}));
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(multer().none());

/**
 * Deletes a phone based on its phone id
 */
app.post("/deletePhone", async function(req, res) {
  try {
    let content = await deletePhone(req.body.phone_id);
    res.type("text");
    res.send(content);
  } catch (error) {
    console.error(error);
    res.type("text");
    res.send(error);
  }
});

/**
 * Deletes phone at phoneId from the database
 * @param {int} phoneId - The id of the phone to delete
 * @return {string} - A success or failure message
 */
async function deletePhone(phoneId) {
  try {
    let query = "DELETE FROM phones WHERE phone_id =?;";
    let database = await getDBConnection();
    await database.all(query, [phoneId]);
    await database.close();
    return "Phone deleted successfully";
  } catch (error) {
    return "Failure to delete phone, error: " + error;
  }
}

/**
 * Endpoint that returns json with the phone id and a success or failure message
 */
app.post("/addPhone", async function(req, res) {
  try {
    let body = req.body;
    let content = await addPhone(body.model, body.color, body.cost, body.date);
    res.json(content);
  } catch (error) {
    res.type("text");
    res.send(error);
  }
});

/**
 * Adds the attributes of the phone to the database and returns json
 * @param {int} model - Int corresponding to the model
 * @param {string} color - Color of the phone
 * @param {float} cost - How much the phone cost to buy
 * @param {DATETIME} date - The date I got the phone
 * @return {json} - The phone id and if the addition was successful JSUT TEXT RN
 */
async function addPhone(model, color, cost, date) {
  try {
    let add = "INSERT INTO phones(phone_cost, date_aquired, status, issues, model, model_id) " +
              "VALUES (?,?,?,?,?,?);";
    let database = await getDBConnection();
    await database.all(add, [parseFloat(cost), date, 0, '',
                        getModel(parseInt(model)) + ' ' + color, parseInt(model)]);
    let query = "SELECT phone_id FROM phones ORDER BY _rowid_ DESC LIMIT 1;";
    let content = await database.all(query);
    await database.close();
    let message = "Failure to add phone";
    if (content !== null) {
      message = "Phone added successfully";
    }
    return {"phone_id": content[0].phone_id, "message": message};
  } catch (error) {
    console.error(error);
  }
}

/**
 * Gets the name of the model of the phone
 * @param {int} modelId - The model id of the given phone to add to database
 * @return {string} - The name of the phone model
 */
function getModel(modelId) {
  let models = new Map();
  models.set(60, "iPhone 6");
  models.set(61, "iPhone 6+");
  models.set(62, "iPhone 6S");
  models.set(63, "iPhone 6S+");
  models.set(70, "iPhone 7");
  models.set(71, "iPhone 7+");
  models.set(80, "iPhone 8");
  models.set(81, "iPhone 8+");
  return models.get(modelId);
}

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
    await database.close();
    return "Successfully Updates!";
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
    await database.close();
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
    await database.close();
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
    await database.close();
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
    await database.close();
    return total.toFixed(2).toString();
  } catch (error) {
    console.error(error);
  }
}

/**
 * Endpoint that gets all the phones based on their status
 */
app.get("/phonesByStatus", async function(req, res) {
  try {
    let content = await getPhonesByStatus(req.query.status);
    res.json(content);
  } catch (error) {
    res.type("text");
    res.send(error);
  }
});

/**
 * Gets information on phones with status status
 * @param {int} status - The status code to request with
 * @return {json} - Information on all the phones with status status
 */
async function getPhonesByStatus(status) {
  try {
    let query = "SELECT * FROM phones WHERE status=?";
    let database = await getDBConnection();
    let content = await database.all(query, [status]);
    await database.close();
    return content;
  } catch (error) {
    console.error(error);
  }
}

/**
 * Endpoint that gets the information on all of the phones from the database
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
    await database.close();
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