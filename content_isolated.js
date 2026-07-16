/* jshint esversion: 6, browser: true */


// Run in an IIFE to avoid creating global variables (ESLint no-implicit-globals)
(function() {
    console.debug("Neutralize Timers: content_isolated.js invoked");
    
    /**
     * Applies or removes a CSS <style> block that disables all CSS animations and transitions.
     * @param {boolean} disableAnimations - Whether to disable animations.
     */
    function applyStyles(disableAnimations) {
        let style = document.getElementById("neutralize-timers-animations");
        if (disableAnimations) {
            if (!style) {
                style = document.createElement("style");
                style.id = "neutralize-timers-animations";
                style.textContent = `
                    * {
                      animation: none !important;
                      transition: none !important;
                    }
                `;
                if (document.documentElement) {
                    document.documentElement.appendChild(style);
                } else {
                    // If documentElement is not available yet, wait for it
                    const observer = new MutationObserver(() => {
                        if (document.documentElement) {
                            document.documentElement.appendChild(style);
                            observer.disconnect();
                        }
                    });
                    observer.observe(document, { childList: true });
                }
            }
        } else {
            if (style) {
                style.remove();
            }
        }
    }

    /**
     * Renders a small legend on the top-right corner of the window.
     * Double-clicking it opens inline controls to change the global extension settings.
     * @param {Object} config - The current configuration object.
     */
    function applyLegend(config) {
        let legend = document.getElementById("neutralize-timers-legend");
        if (config.showLegend) {
            if (!legend) {
                legend = document.createElement("div");
                legend.id = "neutralize-timers-legend";
                
                // Styling the legend container to be more apparent but still unobtrusive (muted wheat color)
                Object.assign(legend.style, {
                    position: 'fixed',
                    top: '4px',
                    right: '4px',
                    fontSize: '11px',
                    color: '#443a29',
                    background: 'rgba(245, 222, 179, 0.95)', // Muted wheat-like background
                    border: '1px solid #d2b48c', // Tan border
                    padding: '4px 8px',
                    borderRadius: '4px',
                    pointerEvents: 'auto', // Allow double click interactions
                    zIndex: '2147483647',
                    fontFamily: 'sans-serif',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    userSelect: 'none' // Prevent text selection on double click
                });

                // Display container for the simple label
                const displaySpan = document.createElement("span");
                displaySpan.id = "nt-display";
                displaySpan.style.cursor = "pointer";
                displaySpan.title = "Double-click to edit Neutralize Timers settings";
                legend.appendChild(displaySpan);

                // Edit form container for inline controls
                const editForm = document.createElement("form");
                editForm.id = "nt-edit";
                editForm.style.display = "none";
                const label1 = document.createElement("label");
                label1.style.marginRight = "5px";
                label1.style.cursor = "pointer";
                label1.textContent = "Delay: ";
                const delayInput = document.createElement("input");
                delayInput.type = "number";
                delayInput.id = "nt-delay-input";
                delayInput.style.width = "50px";
                delayInput.style.fontSize = "10px";
                label1.appendChild(delayInput);
                
                const label2 = document.createElement("label");
                label2.style.marginRight = "5px";
                label2.style.cursor = "pointer";
                label2.textContent = "Anim Off: ";
                const animInput = document.createElement("input");
                animInput.type = "checkbox";
                animInput.id = "nt-anim-input";
                label2.appendChild(animInput);
                
                const saveBtn = document.createElement("button");
                saveBtn.type = "submit";
                saveBtn.style.fontSize = "10px";
                saveBtn.style.cursor = "pointer";
                saveBtn.style.background = "#fff";
                saveBtn.style.border = "1px solid #ccc";
                saveBtn.style.borderRadius = "2px";
                saveBtn.textContent = "Save";
                
                const cancelBtn = document.createElement("button");
                cancelBtn.type = "button";
                cancelBtn.id = "nt-cancel-btn";
                cancelBtn.style.fontSize = "10px";
                cancelBtn.style.cursor = "pointer";
                cancelBtn.style.background = "transparent";
                cancelBtn.style.border = "none";
                cancelBtn.textContent = "X";
                
                editForm.appendChild(label1);
                editForm.appendChild(label2);
                editForm.appendChild(saveBtn);
                editForm.appendChild(cancelBtn);
                legend.appendChild(editForm);

                // Handle double click to enter edit mode
                legend.addEventListener('dblclick', () => {
                    if (editForm.style.display === "none") {
                        displaySpan.style.display = "none";
                        editForm.style.display = "inline-flex";
                        editForm.style.alignItems = "center";
                    }
                });

                // Handle form submission to save settings globally
                editForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    const newDelay = parseInt(editForm.querySelector('#nt-delay-input').value, 10);
                    const newAnim = editForm.querySelector('#nt-anim-input').checked;
                    
                    chrome.storage.sync.set({
                        minDelay: isNaN(newDelay) ? 60000 : newDelay,
                        disableAnimations: newAnim
                    }, () => {
                        editForm.style.display = "none";
                        displaySpan.style.display = "inline";
                    });
                });

                // Handle cancel button to exit edit mode
                editForm.querySelector('#nt-cancel-btn').addEventListener('click', (e) => {
                    e.stopPropagation(); // prevent dblclick from triggering again
                    editForm.style.display = "none";
                    displaySpan.style.display = "inline";
                    
                    // Reset inputs to current config
                    chrome.storage.sync.get(['minDelay', 'disableAnimations'], (items) => {
                        editForm.querySelector("#nt-delay-input").value = items.minDelay;
                        editForm.querySelector("#nt-anim-input").checked = items.disableAnimations;
                    });
                });

                // Safely append to the document body
                const appendLegend = () => {
                    if (document.body) {
                        document.body.appendChild(legend);
                    } else {
                        requestAnimationFrame(appendLegend);
                    }
                };
                appendLegend();
            }

            // Update displayed values whenever config is loaded/reloaded
            legend.querySelector("#nt-display").textContent = `NT: Delay ${config.minDelay}ms | Anim ${config.disableAnimations ? 'Off' : 'On'}`;
            legend.querySelector("#nt-delay-input").value = config.minDelay;
            legend.querySelector("#nt-anim-input").checked = config.disableAnimations;

        } else {
            // Remove the legend if showLegend is false
            if (legend) {
                legend.remove();
            }
        }
    }

    /**
     * Loads the configuration from Chrome's sync storage and applies it.
     */
    function loadConfig() {
        chrome.storage.sync.get({
            minDelay: 60000,
            disableAnimations: true,
            showLegend: false
        }, (config) => {
            // Send the loaded configuration to the main world content script (content.js)
            // so it can adjust its MIN_DELAY variable dynamically.
            window.postMessage({ type: "NEUTRALIZE_TIMERS_CONFIG", config: config }, "*");
            
            // Apply visual changes based on config
            applyStyles(config.disableAnimations);
            applyLegend(config);
        });
    }

    // Initialize logic on script load
    loadConfig();

    // Listen for options changes coming from the options page or inline controls
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'sync') {
            loadConfig();
        }
    });

})();
