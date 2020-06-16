"use strict";
(function() {
  window.addEventListener("load", init);

  /**
   * Allows for the loadup gif to play before switching html
   */
  function init() {
    setTimeout(() => {
      window.location.href = "html/main.html";
    }, 2000);
  }
})();