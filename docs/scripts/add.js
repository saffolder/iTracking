/**
 * Developer: Samuel Affolder
 * Date: 06/17/2020
 *
 * This js manages the add phone functionality of the database.
 */
"use strict";
(function() {

  const IMG_PATH_PHONES = "../images/phones/iPhone";

  window.addEventListener("load", init);

  /**
   * Initializes the webpage after the DOM loads in
   */
  function init() {
    id("update").addEventListener("click", updatePhone);
    id("remove").addEventListener("click", removePhone);
    id("info-btn").addEventListener("click", (event) => {
      event.preventDefault();
      addPhoneToSystem();
    });
    id("submit-btn").addEventListener("click", (event) => {
      event.preventDefault();
      updateDatabase();
    });
    enableButtons();
    id("model-select").addEventListener("change", changeImage);
  }

  /**
   * Changes the image next to add phone
   */
  function changeImage() {
    id("phone-select").src = IMG_PATH_PHONES + this.value + ".jpeg";
  }

  /**
   * Collects the information from the form
   */
  function updateDatabase() {
    let updates = [];
    let values = [];
    updates.push("status =?");
    values.push(id("status-update").value);
    if (id("issue-update").value !== "") {
      updates.push("issues =?");
      values.push(id("issue-update").value);
    }
    let newParts = qsa(".part-selector.selected");
    if (newParts.length > 0) {
      updates.push("parts_purchased =?");
      values.push("[" + allPartsOrdered(newParts).toString() + "]");
    }
    if (id("sell-price").value !== "") {
      updates.push("sold =?");
      values.push(id("sell-price").value);
    }
    makeUpdates(id("single-phone").attr, updates, values);
  }

  /**
   * Adds newParts to current list of purchased parts for this phone
   * @param {element[]} newParts - Array of the selected parts list
   * @return {int[]} - int array of all the part ids of ordered parts for this phone
   */
  function allPartsOrdered(newParts) {
    let parts = id("parts-list").children;
    let allParts = [];
    for (let i = 0; i < parts.length; i++) {
      allParts.push(parseInt(parts[i].attr));
    }
    for (let i = 0; i < newParts.length; i++) {
      allParts.push(newParts[i].attr);
    }
    return allParts;
  }

  /**
   * Makes a fetch to the backend to update database with new information on phone
   * @param {int} phone - the phone id to update
   * @param {string[]} updates - The query for the updates
   * @param {object[]} values - The objects for the update (matching indexes to updates)
   */
  function makeUpdates(phone, updates, values) {
    fetch("/updatePhone", {method: "POST", headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }, body: JSON.stringify({phoneId: phone, update: updates, value: values})})
      .then(checkStatus)
      .then(response => response.text())
      .then(() => {
        id("update-area").classList.add("hidden");
        getPhoneData(id("single-phone").attr);
      })
      .catch(handleError);
  }

  /**
   * Allows the user to update the phone with new information
   */
  function updatePhone() {
    id("single-phone").classList.add("hidden");
    id("update-area").classList.remove("hidden");
    window.scrollTo(0, 0);
    showParts();
  }

  /**
   * Fetches for the parts for purchase for the selected phone
   */
  function showParts() {
    let query = "?model=" + id("single-phone").attr1;
    fetch("/allParts" + query)
      .then(checkStatus)
      .then(response => response.json())
      .then(displayPartOptions)
      .catch(handleError);
  }

  /**
   * Populates the DOM with the list of parts for purchase
   * @param {json} partsList - Array of names of all part names and part id
   */
  function displayPartOptions(partsList) {
    let selection = id("parts");
    for (let i = 0; i < partsList.length; i++) {
      let part = gen("div");
      part.classList.add("part-selector");
      part.attr = partsList[i].part_id;
      let box = gen("div");
      box.classList.add("box");
      let name = gen("p");
      name.textContent = partsList[i].part_name;
      part.appendChild(box);
      part.appendChild(name);
      selection.appendChild(part);
      part.addEventListener("click", () => {
        part.classList.toggle("selected");
      });
    }
  }

  /**
   * Deletes this phone from the database.
   */
  function removePhone() {
    let phoneId = id("single-phone").attr;
    let params = new FormData();
    params.append("phone_id", phoneId);
    fetch("/deletePhone", {method: "POST", body: params})
      .then(checkStatus)
      .then(response => response.text())
      .then(() => {
        window.location.href = "main.html";
      })
      .catch(handleError);
  }

  /**
   * When a new phone form has been submitted, fetches the update
   */
  function addPhoneToSystem() {
    let data = new FormData(id("add-form"));
    fetch("/addPhone", {method: "POST", body: data})
      .then(checkStatus)
      .then(response => response.json())
      .then(displayPhone)
      .catch(handleError);
  }

  /**
   * After adding a phone it default views to that phone screen
   * @param {json} content - phone id and message about success or failure to update
   */
  function displayPhone(content) {
    id("single-phone").attr = content.phone_id;
    id("add-area").classList.add("hidden");
    getPhoneData(content.phone_id);
  }

  /**
   * Fetches for all the information on a given phone
   * @param {int} phoneId - The id of the phone
   */
  function getPhoneData(phoneId) {
    let params = new FormData();
    params.append("phone_id", phoneId);
    fetch("/phoneInfo", {method: "POST", body: params})
      .then(checkStatus)
      .then(response => response.json())
      .then(singlePhone)
      .catch(handleError);
  }

  /**
   * Displays all of the information about the phone
   * @param {json} phone - All the information about the phone
   */
  function singlePhone(phone) {
    window.scrollTo(0, 0);
    id("single-phone").classList.remove("hidden");
    id("single-phone").attr = phone.phone_id;
    id("single-phone").attr1 = phone.model_id;
    qs("#single-image > img").src = IMG_PATH_PHONES + phone.model_id + ".jpeg";
    qs("#single-image > h2").textContent = getStatus(phone.status);
    qs("#single-image > h2").style["color"] = getColor(phone.status);
    id("model").textContent = phone.model;
    id("issues").textContent = phone.issues;
    let sold = phone.sold || 0.0;
    id("sold-price").textContent = "$" + sold;
    id("phone-cost").textContent = "$" + phone.phone_cost;
    id("date").textContent = phone.date_aquired;
    let partsList = [];
    addParts(partsList, phone.parts_purchased);
    getParts(partsList);
    partsCost(partsList, sold, phone.phone_cost, id("net-price"));
    partsCost(partsList, 0, 0, id("parts-cost"));
  }

  /**
   * Makes a call to the api to get the cost of all the parts then updates DOM with net price.
   * @param {int[]} partsList - array with the value being the id of the part
   * @param {float} netGain - How much profit the phone brought
   * @param {float} netLoss - How much the phone cost
   * @param {element} element - The element that will be updated with net price
   */
  function partsCost(partsList, netGain, netLoss, element) {
    if (partsList !== null) {
      let parts = new FormData();
      parts.append("parts", partsList);
      fetch("/partsCost", {method: "POST", body: parts})
        .then(checkStatus)
        .then(value => value.text())
        .then((price) => {
          updateCost(netGain, netLoss, parseFloat(price), element);
        })
        .catch(handleError);
    } else {
      updateCost(netGain, netLoss, 0, element);
    }
  }

  /**
   * Updates the income with how much money I am in the positive or negative
   * @param {double} netGain - How much money made from selling
   * @param {double} netLoss - The cost of phones
   * @param {int} parts - The cost of parts
   * @param {element} element - The element that will be displayed with the new text
   */
  function updateCost(netGain, netLoss, parts, element) {
    let netPrice = netGain - (netLoss + parts);
    if (netPrice >= 0) {
      element.textContent = "$" + netPrice.toFixed(2);
      element.classList.remove("debt");
      element.classList.add("gain");
    } else {
      element.textContent = "$" + Math.abs(netPrice.toFixed(2));
      element.classList.remove("gain");
      element.classList.add("debt");
    }
  }

  /**
   * Makes a fetch to the api for a list of the parts names
   * @param {int[]} partsList - array with the value being the id of the part
   */
  function getParts(partsList) {
    let parts = new FormData();
    parts.append("parts", partsList);
    fetch("/phoneParts", {method: "POST", body: parts})
      .then(checkStatus)
      .then(response => response.json())
      .then(displayParts)
      .catch(handleError);
  }

  /**
   * Displays in a list the parts purchased for this phone
   * @param {json} partsList - json array of the names of parts purchased for the phone
   */
  function displayParts(partsList) {
    clearParts();
    let list = id("parts-list");
    for (let i = 0; i < partsList.length; i++) {
      let part = gen("li");
      part.attr = partsList[i].part.part_id;
      part.textContent = partsList[i].part.part_name.part_name;
      list.appendChild(part);
    }
  }

  /**
   * Removes all of the old parts off the DOM
   */
  function clearParts() {
    let parts = qsa("#parts-list > *");
    for (let i = 0; i < parts.length; i++) {
      parts[i].remove();
    }
  }

  /**
   * Adds the parts purchased for this phone to the total parts list array
   * @param {int[]} partsList - Int array of the parts ids
   * @param {string} partsPurchased - String representation of parts list of given phone
   */
  function addParts(partsList, partsPurchased) {
    if (partsPurchased !== null) {
      let parts = [];
      if (partsPurchased.length > 3) {
        parts = partsPurchased.substring(1, partsPurchased.length - 1).split(",");
      } else {
        parts.push(partsPurchased.substring(1, 2));
      }
      for (let i = 0; i < parts.length; i++) {
        if (!isNaN(parseInt(parts[i]))) {
          partsList.push(parts[i]);
        }
      }
    }
  }

  /**
   * Helper method that gets the status of the phone based on its status code.
   * @param {int} status - The int represnetation of the status of the phone
   * @return {string} - String of the status of the phone
   */
  function getStatus(status) {
    let statuses = ["Needs fixed", "Waiting for parts", "Fixing", "Fixed", "Sold", "Can't fix"];
    return statuses[status];
  }

  /**
   * Helper method to dynamically get the status of phone for the color
   * @param {int} status - The numerical status 0-5 of the phone
   * @return {string} - The color to change the status to
   */
  function getColor(status) {
    let statuses = ["rgb(244,54,34)", "rgb(253,247,36)", "rgb(36,70,253)", "rgb(96,253,36)",
                    "rgb(245, 10, 167)", "rgb(0,0,0)"];
    return statuses[status];
  }

  /**
   * Links the tabs with actions that relate to their names
   */
  function enableButtons() {
    id("logo").addEventListener("click", () => {
      window.location.href = "../html/main.html";
    });
    id("fixing").addEventListener("click", () => {
      window.location.href = "../html/fixing.html";
    });
    id("waiting").addEventListener("click", () => {
      window.location.href = "../html/waiting.html";
    });
    id("fixed").addEventListener("click", () => {
      window.location.href = "../html/fixed.html";
    });
    id("broken").addEventListener("click", () => {
      window.location.href = "../html/broken.html";
    });
    id("add").addEventListener("click", () => {
      window.location.href = "../html/add.html";
    });
    id("account").addEventListener("click", () => {
      window.location.href = "../html/account.html";
    });
  }

  /**
   * Lets the user know that an error occured on the server.
   * @param {string} error - The error that will be displayed.
   */
  function handleError(error) {
    console.error(error);
  }

  /**
   * Makes sure that our request to the api went through and returned what we want
   * @param {json} response - The json that is requested from Edamam api
   * @return {json} - The json that is requested from Edamam api Error if bad request
   */
  function checkStatus(response) {
    if (response.ok) {
      return response;
    }
    throw Error("Error in request: " + response.statusText);
  }

  /**
   * Returns a DOM object whose id property matches idName
   * @param {string} idName - Specific id
   * @return {object} - Dom object to return, null if no match
   */
  function id(idName) {
    return document.getElementById(idName);
  }

  /**
   * Returns an element that matches the selector
   * @param {string} selector - The specific path to take to get the element
   * @return {element} - The element, null if no match
   */
  function qs(selector) {
    return document.querySelector(selector);
  }

  /**
   * Returns a list of elements that match the selector
   * @param {string} selector - The specific path to take to get the elements
   * @return {list}- The list of elements, if no matches returns null
   */
  function qsa(selector) {
    return document.querySelectorAll(selector);
  }

  /**
   * Returns a newly made Element node
   * @param {string} elType - A specific element type
   * @return {element} - The element node
   */
  function gen(elType) {
    return document.createElement(elType);
  }

})();