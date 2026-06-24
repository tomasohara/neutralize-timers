// Overrides interval functions so that the timers are set as low as possible.
// It also disables animations and defines function to list intervals in use.
//
// Via ChatGPT.
//
// Running JSHint:
//    $ grep -iv jslint content.js | jshint --filename content.js


// JSHint options:
/* jshint esversion: 6, browser: true, devel: true */

// JSLint options:
/*jslint browser, devel, node, trace, beta, bitwise, convert, eval, fart, for, getset, indent2, nomen, single, subscript, long, this, unordered, variable, white */

/*global chrome, console*/
console.debug("chrome=" + chrome);

const setup = function () {
    const MIN_DELAY = 60000;

    const realSetTimeout = window.setTimeout;
    const realSetInterval = window.setInterval;
    const realClearInterval = window.clearInterval;

    const activeIntervals = new Map();

    // Override setInterval
    window.setInterval = function (fn, delay, ...args) {
        const adjustedDelay = Math.max(delay || 0, MIN_DELAY);
        const id = realSetInterval(fn, adjustedDelay, ...args);
        activeIntervals.set(id, {
            delay: adjustedDelay,
            created: Date.now()
        });
        return id;
    };

    // Override clearInterval
    window.clearInterval = function (id) {
        activeIntervals.delete(id);
        return realClearInterval(id);
    };

    // Override setTimeout
    window.setTimeout = function (fn, delay, ...args) {
        const adjustedDelay = Math.max(delay || 0, MIN_DELAY);
        return realSetTimeout(fn, adjustedDelay, ...args);
    };

    //................................................................................
    // Debug helpers

    // Show active interval timers

    window.listIntervals = function () {

	const result = [];
	const now = Date.now();

	activeIntervals.forEach(function (info, id_value) {

            result.push({
		id: id_value,
		delay: info.delay,
		age_ms: now - info.created
            });

	});

	return result;
    };

    // Clear all interval timers
    window.clearIntervals = function () {
	let i;
        for (i = 0; i < 10000; i += 1) {
            realClearInterval(i);
        }
    };

    // --------------------------------------------------
    // Kill CSS animations (spinners, loaders, etc.)

    function disable_animations () {
        console.log("Disabling animation");

        const style = document.createElement("style");

        style.textContent = `
            * {
              animation: none !important;
              transition: none !important;
            }
           `;

        document.documentElement.appendChild(style);
    }

    disable_animations();

};

setup();
