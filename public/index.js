/**
 * Developer: Samuel Affolder
 * Date: 06/10/2020
 *
 * This handles interaction with the user and the backend database to store and
 * retrieve information about the iPhones that I have been repairing.
 */
"use strict";

(function() {

  const IMG_PATH_PHONES = "images/phones/iPhone";
  const IMG_PATH_STATUS = "images/status/status";
  window.addEventListener("load", init);

  /**
   * Initializes the webpage as soon as the DOM has loaded in.
   */
  function init() {
    setHomepage();
    id("order-btn").addEventListener("click", setHomepage);
  }

  /**
   * Makes a fetch request for the information of all the phones from the database
   */
  function setHomepage() {
    id("err-text").classList.add("hidden");
    id("single-phone").classList.add("hidden");
    clearHomepage();
    let order = id("order-by").value;
    fetch("/allPhones?order=" + order)
      .then(checkStatus)
      .then(response => response.json())
      .then(displayPhones)
      .catch(handleError);
  }

  /**
   * Populates the homepage with the data in a neat format
   * @param {json} phoneData - Basic information on all of the phones in the database
   */
  function displayPhones(phoneData) {
    let display = id("phones");
    let netLoss = 0.0;
    let netGain = 0.0;
    let partsList = [];
    for (let i = 0; i < phoneData.length; i++) {
      addParts(partsList, phoneData[i].parts_purchased);
      let phone = gen("div");
      setPhone(phone, phoneData[i].phone_id);
      let status = gen("img");
      setStatus(status, phoneData[i].status);
      let img = gen("img");
      setImage(img, phoneData[i].model_id);
      let model = gen("p");
      setModel(model, phoneData[i].model);
      let cost = gen("span");
      setCost(cost, phoneData[i].phone_cost);
      netLoss += phoneData[i].phone_cost;
      let issues = gen("p");
      setIssues(issues, phoneData[i].issues);
      if (phoneData[i].sold) {
        netGain += phoneData[i].sold;
      }
      appendChildren(phone, status, img, model, cost, issues);
      phone.addEventListener("click", getPhoneData);
      display.appendChild(phone);
    }
    let parts = partsCost(partsList);
    updateCost(netGain, netLoss, parts);
  }

  /**
   * Makes a call to the api to get the cost of all the parts.
   * @param {int[]} partsList - array with the value being the id of the part
   * @return {double} - The total cost of the parts
   */
  function partsCost(partsList) {
    let parts = new FormData();
    parts.append("parts", partsList);
    let cost = 0.0;
    fetch("/partsCost", {method: "POST", body: parts})
      .then(checkStatus)
      .then(value => value.text())
      .then((price) => {
        cost = parseFloat(price).toFixed(2);
      })
      .catch(handleError);
    return cost;
  }

  /**
   * Updates the income with how much money I am in the positive or negative
   * @param {double} netGain - How much money made from selling
   * @param {double} netLoss - The cost of phones
   * @param {int} parts - The cost of parts
   */
  function updateCost(netGain, netLoss, parts) {
    let income = id("income");
    let netPrice = netGain - (netLoss + parts);
    if (netPrice >= 0) {
      income.textContent = "$" + netPrice.toFixed(2);
      income.remove("debt");
      income.classList.add("gain");
    } else {
      income.textContent = "$" + Math.abs(netPrice.toFixed(2));
      income.classList.remove("gain");
      income.classList.add("debt");
    }
  }

  /**
   * Adds the parts purchased for this phone to the total parts list array
   * @param {int[]} partsList - Int array of the parts ids
   * @param {string} partsPurchased - String representation of parts list of given phone
   */
  function addParts(partsList, partsPurchased) {
    let parts = partsPurchased.substring(1, partsPurchased.length - 1).split(",");
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] !== "") {
        partsList.push(parts[i]);
      }
    }
  }

  /**
   *
   * @param {p} issuesEl - Paragraph element
   * @param {string} issues - The issue that the phone has
   */
  function setIssues(issuesEl, issues) {
    issuesEl.textContent = issues;
    issuesEl.classList.add("issues");
  }

  /**
   * Helper method, sets the class and updates the cost of the phone
   * @param {span} costEl - Span element containing cost value
   * @param {int} cost - The cost of the phone
   */
  function setCost(costEl, cost) {
    costEl.textContent = "$" + cost.toFixed(2);
    costEl.classList.add("cost");
  }

  /**
   * Helper method, sets the class and text to the iPhones model
   * @param {p} modelEl - Paragraph element
   * @param {string} model - The name of the iPhone
   */
  function setModel(modelEl, model) {
    modelEl.textContent = model;
    modelEl.classList.add("model-name");
  }

  /**
   * Helper method, sets class and src of iPhone img
   * @param {img} phoneImg - The image of iPhone
   * @param {int} modelId - The model id of the iPhone
   */
  function setImage(phoneImg, modelId) {
    phoneImg.src = IMG_PATH_PHONES + modelId + ".jpeg";
    phoneImg.classList.add("phone-img");
  }

  /**
   * Helper method, sets class and attr of phone
   * @param {div} phone - The phone card
   * @param {integer} phoneId - The id of the phone
   */
  function setPhone(phone, phoneId) {
    phone.classList.add("phone-card");
    phone.attr = phoneId;
  }

  /**
   * Helper method, sets src of img
   * @param {img} statusImg - The img element
   * @param {int} status - The code of the phone status
   */
  function setStatus(statusImg, status) {
    statusImg.src = IMG_PATH_STATUS + status + ".png";
    statusImg.classList.add("status-img");
  }

  /**
   * Makes a fetch request to get detailed information on the selected phone
   */
  function getPhoneData() {
    let phoneBody = new FormData();
    phoneBody.append("phone_id", this.attr);
    fetch("/phoneInfo", {method: "POST", body: phoneBody})
      .then(checkStatus)
      .then(response => response.json())
      .then(singlePhone)
      .catch(handleError);
  }

  /**
   *
   * @param {div} phone - The phone card that holds all the information
   * @param {img} status - Small img indicating the status of the phone
   * @param {img} img - The picture of the iPhone
   * @param {p} model - Text with the iPhone model
   * @param {span} cost - Text of how much the phone cost
   * @param {p} issues - Text describing the issues of the phone.
   */
  function appendChildren(phone, status, img, model, cost, issues) {
    model.appendChild(cost);
    phone.appendChild(status);
    phone.appendChild(img);
    phone.appendChild(model);
    phone.appendChild(issues);
  }

  /**
   * Makes sure that when a new search begins that there isn't any old query results
   */
  function clearHomepage() {
    let phones = qsa("div.phone-card");
    for (let i = 0; i < phones.length; i++) {
      phones[i].remove();
    }
  }

  /**
   * Changes view from all phones to the phone clicked
   */
  function singlePhone() {
    id("all-phones").classList.add("hidden");

  }

  /**
   * Lets the user know that an error occured on the server.
   * @param {string} error - The error that will be displayed.
   */
  function handleError(error) {
    id("err-text").classList.remove("hidden");
    id("err-text").textContent = error;
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