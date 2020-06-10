/**
 * Developer: Samuel Affolder
 * Date: 06/10/2020
 *
 * This handles interaction with the user and the backend database to store and
 * retrieve information about the iPhones that I have been repairing.
 */
"use strict";
(function() {

  window.addEventListener("load", init);

  /**
   * Initializes the webpage as soon as the DOM has loaded in.
   */
  function init() {
    // TODO: implement everything
  }

  /**
   * Lets the user know that an error occured on the server.
   */
  function handleError() {
   // TODO: implement error handling function
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