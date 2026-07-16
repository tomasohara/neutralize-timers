/* jshint esversion: 6, browser: true */


// Wrap in an IIFE to prevent polluting the global scope
(function() {
    console.debug("Neutralize Timers: options.js invoked");

    /**
     * Initializes the options page by loading the current settings 
     * from chrome.storage.sync and populating the form inputs.
     */
    document.addEventListener('DOMContentLoaded', () => {
        chrome.storage.sync.get({
            minDelay: 60000,
            disableAnimations: true,
            showLegend: false
        }, (items) => {
            document.getElementById('minDelay').value = items.minDelay;
            document.getElementById('disableAnimations').checked = items.disableAnimations;
            document.getElementById('showLegend').checked = items.showLegend;
        });
    });

    /**
     * Saves the form inputs to chrome.storage.sync when the Save button is clicked.
     * Also displays a temporary success message.
     */
    document.getElementById('save').addEventListener('click', () => {
        const minDelay = parseInt(document.getElementById('minDelay').value, 10);
        const disableAnimations = document.getElementById('disableAnimations').checked;
        const showLegend = document.getElementById('showLegend').checked;

        chrome.storage.sync.set({
            minDelay: isNaN(minDelay) ? 60000 : minDelay,
            disableAnimations: disableAnimations,
            showLegend: showLegend
        }, () => {
            const status = document.getElementById('status');
            status.textContent = 'Options saved.';
            
            // Clear the status message after 2 seconds
            setTimeout(() => {
                status.textContent = '';
            }, 2000);
        });
    });
})();
