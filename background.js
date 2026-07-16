/* jshint esversion: 6 */
console.debug("Neutralize Timers: background.js invoked");

chrome.runtime.onInstalled.addListener(() => {
  console.log("Neutralize Times installed");
});
