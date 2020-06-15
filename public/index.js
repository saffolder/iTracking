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
    id("home-btn").addEventListener("click", setHomepage);
    id("update-btn").addEventListener("click", updatePhone);
    id("submit-btn").addEventListener("click", (event) => {
      event.preventDefault();
      updateDatabase();
    });
    id("add-phone").addEventListener("click", () => {
      hideHomepage(true);
    });
    id("add-form").addEventListener("submit", (event) => {
      event.preventDefault();
      addPhoneToSystem();
    });
    id("delete-btn").addEventListener("click", deletePhone);
  }

  /**
   * Deletes this phone from the database.
   */
  function deletePhone() {
    let phoneId = id("single-phone").attr;
    let params = new FormData();
    params.append("phone_id", phoneId);
    fetch("/deletePhone", {method: "POST", body: params})
      .then(checkStatus)
      .then(response => response.text())
      .then((message) => {
        setHomepage();
        alertUpdate(message);
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
    alertUpdate(content.message);
    hideMe(id("add-area"));
    id("single-phone").attr = content.phone_id;
    getPhoneData(content.phone_id);
  }

  /**
   * Makes a fetch request for the information of all the phones from the database
   */
  function setHomepage() {
    homeButton();
    clearHomepage();
    let order = id("order-by").value;
    fetch("/allPhones?order=" + order)
      .then(checkStatus)
      .then(response => response.json())
      .then((content) => {
        displayPhones(content, id("phones"));
      })
      .catch(handleError);
  }

  /**
   * Populates the homepage with the data in a neat format
   * @param {json} phoneData - Basic information on all of the phones in the database
   * @param {section} display - The container for the phone divs
   */
  function displayPhones(phoneData, display) {
    let netLoss = 0.0;
    let netGain = 0.0;
    let partsList = [];
    for (let i = 0; i < phoneData.length; i++) {
      addParts(partsList, phoneData[i].parts_purchased);
      let phone = gen("div");
      setPhone(phone, phoneData[i].phone_id);
      let status = gen("img");
      setStatus(status, phoneData[i].status);
      let phoneId = gen("p");
      setPhoneId(phoneId, phoneData[i].phone_id);
      let img = gen("img");
      setImage(img, phoneData[i].model_id);
      let model = gen("p");
      setModel(model, phoneData[i].model);
      let cost = gen("span");
      setCost(cost, phoneData[i].phone_cost);
      netLoss += phoneData[i].phone_cost;
      let issues = gen("p");
      setIssues(issues, phoneData[i].issues);
      if (phoneData[i].sold) {netGain += phoneData[i].sold;}
      appendChildren(phone, status, phoneId, img, model, cost, issues);
      phone.addEventListener("click", () => {
        getPhoneData(phoneData[i].phone_id);
      });
      display.appendChild(phone);
    }
    partsCost(partsList, netGain, netLoss, id("income"));
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
    for (let i = 0; i < partsList.length; i += 2) {
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
      .then((message) => {
        alertUpdate(message);
        hideMe(id("update-area"));
        getPhoneData(id("single-phone").attr);
      })
      .catch(handleError);
  }

  /**
   * Alerts the user of message
   * @param {string} message - Update success or failure message
   */
  function alertUpdate(message) {
    setTimeout(() => {
      id("message-center").classList.remove("hidden");
      id("message").textContent = message;
    }, 2000); // might need to make 1750
    id("message-center").classList.add("hidden");
    //console.log(message);
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
   * Makes a fetch request to get detailed information on the selected phone
   * @param {string} phoneId - The id of the phone
   */
  function getPhoneData(phoneId) {
    let phoneBody = new FormData();
    phoneBody.append("phone_id", phoneId);
    fetch("/phoneInfo", {method: "POST", body: phoneBody})
      .then(checkStatus)
      .then(response => response.json())
      .then(singlePhone)
      .catch(handleError);
  }

  /**
   * Changes view from all phones to the phone clicked and displays the clicked phones information
   * @param {json} phoneInfo - Formatted information about the single phone.
   */
  function singlePhone(phoneInfo) {
    hideHomepage(false);
    id("single-phone").attr = phoneInfo.phone_id;
    id("single-phone").attr1 = phoneInfo.model_id;
    id("status-img").src = IMG_PATH_STATUS + phoneInfo.status + ".png";
    id("status-text").textContent = getStatus(phoneInfo.status);
    id("phone-img").src = IMG_PATH_PHONES + phoneInfo.model_id + ".jpeg";
    id("model").textContent = phoneInfo.model;
    id("date-aquired").textContent = phoneInfo.date_aquired;
    id("issue-description").textContent = phoneInfo.issues;
    let netGain = phoneInfo.sold || 0.0;
    id("sold-price").textContent = "$" + netGain;
    id("phone-cost").textContent = "$" + phoneInfo.phone_cost;
    let partsList = [];
    addParts(partsList, phoneInfo.parts_purchased);
    getParts(partsList);
    partsCost(partsList, netGain, phoneInfo.phone_cost, id("net-price"));
    partsCost(partsList, 0, 0, id("parts-total"));
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
   * Displays a form to fill out to update the information of the selected phone
   */
  function updatePhone() {
    hideSingleview();
    clearUpdatePage();
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
   * Helper method, hides the single phone view
   */
  function hideSingleview() {
    id("single-phone").classList.add("hidden");
    id("update-area").classList.remove("hidden");
    id("update-btn").classList.add("hidden");
  }

  /**
   * Helper method to make sure that the update page is reset between phones
   */
  function clearUpdatePage() {
    id("issue-update").value = "";
    let parts = qsa(".part-selector");
    for (let i = 0; i < parts.length; i++) {
      parts[i].remove();
    }
    id("sell-price").value = "";
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
   * Makes sure the right things are hidden and displayed when the home page comes up
   */
  function homeButton() {
    id("income").classList.remove("hidden");
    id("single-phone").classList.add("hidden");
    id("err-text").classList.add("hidden");
    id("all-phones").classList.remove("hidden");
    id("update-btn").classList.add("hidden");
    id("add-phone").classList.remove("hidden");
    id("phones").classList.remove("hidden");
    id("update-area").classList.add("hidden");
    id("add-area").classList.add("hidden");
  }

  /**
   * Helper method, hides the element
   * @param {element} element - The element to hide
   */
  function hideMe(element) {
    element.classList.add("hidden");
  }

  /**
   * Helper method, when a user selects a single phone it hides the homepage
   * @param {boolean} addingPhone - true if adding a phone, false if displaying single phone
   */
  function hideHomepage(addingPhone) {
    id("income").classList.add("hidden");
    id("phones").classList.add("hidden");
    id("all-phones").classList.add("hidden");
    id("single-phone").classList.remove("hidden");
    id("update-btn").classList.remove("hidden");
    id("add-phone").classList.add("hidden");
    id("err-text").classList.add("hidden");
    if (addingPhone) {
      id("single-phone").classList.add("hidden");
      id("update-btn").classList.add("hidden");
      id("add-area").classList.remove("hidden");
    }
  }

  /**
   * Sets the phone id on the main page for each phone
   * @param {p} phoneIdEl - paragraph element
   * @param {string} phoneId - The phone id
   */
  function setPhoneId(phoneIdEl, phoneId) {
    phoneIdEl.textContent = phoneId;
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
   * Helper method that gets the status of the phone based on its status code.
   * @param {int} status - The int represnetation of the status of the phone
   * @return {string} - String of the status of the phone
   */
  function getStatus(status) {
    let statuses = ["Needs fixed", "Waiting for parts", "Fixing", "Fixed", "Sold", "Can't fix"];
    return statuses[status];
  }

  /**
   * Helper method that adds all the children to the DOM
   * @param {div} phone - The phone card that holds all the information
   * @param {img} status - Small img indicating the status of the phone
   * @param {p} phoneId - The paragraph the contains the phone id
   * @param {img} img - The picture of the iPhone
   * @param {p} model - Text with the iPhone model
   * @param {span} cost - Text of how much the phone cost
   * @param {p} issues - Text describing the issues of the phone.
   */
  function appendChildren(phone, status, phoneId, img, model, cost, issues) {
    model.appendChild(cost);
    phone.appendChild(status);
    phone.appendChild(img);
    phone.appendChild(model);
    phone.appendChild(issues);
    phone.appendChild(phoneId);
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