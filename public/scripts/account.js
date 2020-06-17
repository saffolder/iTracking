/**
 * Developer: Samuel Affolder
 * Date: 06/17/2020
 *
 * This handles all of the user interaction on the account page.
 */
"use strict";
(function() {

  window.addEventListener("load", init);

  /**
   * Initializes the page once the DOM has been loaded in
   */
  function init() {
    enableButtons();
    getStats();
  }

  /**
   * Makes a request for the cumulative information about the phones
   */
  function getStats() {
    fetch("/account")
      .then(checkStatus)
      .then(response => response.json())
      .then(showStats)
      .catch(handleError);
  }

  /**
   * Displays stats
   * @param {json} stats - All the information about the phones
   */
  function showStats(stats) {
    id("broken").textContent = stats.status.broken;
    id("need-fixed").textContent = stats.status.need;
    id("waiting").textContent = stats.status.waiting;
    id("fixing").textContent = stats.status.fixing;
    id("fixed").textContent = stats.status.fixed;
    id("sold").textContent = stats.status.sold;
    id("parts-cost").textContent = "$" + stats.money.parts;
    id("phones-cost").textContent = "$" + stats.money.phones;
    id("profit").textContent = "$" + stats.money.profit;
    let net = stats.money.profit - (stats.money.parts + stats.money.phones);
    if (net > 0) {
      id("net").textContent = net;
      id("net").classList.add("gain");
    } else {
      id("net").textContent = Math.abs(net);
      id("net").classList.add("debt");
    }
  }

  /**
   * Links the tabs with actions that relate to their names
   */
  function enableButtons() {
    id("logo").addEventListener("click", () => {
      window.location.href = "main.html";
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