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
    let display = id("all-phones");
    // make sure to track the NET total and display when done
    for (let i = 0; i < phoneData.length; i++) {
      let phone = gen("div");
      phone.classList.add("phone-card");
      phone.attr = phoneData[i].phone_id;

      let img = gen("img");
      img.src = IMG_PATH_PHONES + phoneData[i].model_id + ".jpeg";
      img.classList.add("phone-img");

      let description = gen("p");
      description.classList.add("description");

      phone.appendChild(img);
      phone.appendChild(description);
      phone.addEventListener("click", getPhoneData);
      display.appendChild(phone);
    }
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
   * Changes view from all phones to the phone clicked
   */
  function singlePhone() {
    id("all-phones").classList.add("hidden");

  }

  /**
   * Lets the user know that an error occured on the server.
   */
  function handleError() {
    id("err-text").classList.remove("hidden");
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