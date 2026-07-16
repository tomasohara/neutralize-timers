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


console.debug("Neutralize Timers: content.js invoked");

const setup = function () {
    let MIN_DELAY = 60000;

    const realSetTimeout = window.setTimeout;
    const realSetInterval = window.setInterval;
    const realClearTimeout = window.clearTimeout;
    const realClearInterval = window.clearInterval;

    let nextTimerId = 1;
    const activeTimers = new Map(); // myId -> { nativeId, isInterval, fn, originalDelay, args, startTime, cleanupId }

    window.addEventListener("message", (event) => {
        if (event.source !== window || !event.data || event.data.type !== "NEUTRALIZE_TIMERS_CONFIG") {
            return;
        }
        
        const newMinDelay = event.data.config.minDelay;
        if (newMinDelay !== MIN_DELAY) {
            MIN_DELAY = newMinDelay;
            console.debug(`Neutralize Timers: Updated MIN_DELAY to ${MIN_DELAY}ms. Rescheduling active timers...`);
            
            // Reschedule all active timers to respect the new MIN_DELAY
            for (const [myId, timer] of activeTimers.entries()) {
                const adjustedDelay = Math.max(timer.originalDelay, MIN_DELAY);
                
                if (timer.isInterval) {
                    realClearInterval(timer.nativeId);
                    timer.nativeId = realSetInterval(timer.fn, adjustedDelay, ...timer.args);
                } else {
                    realClearTimeout(timer.nativeId);
                    if (timer.cleanupId) realClearTimeout(timer.cleanupId);
                    
                    const elapsed = Date.now() - timer.startTime;
                    let remaining = adjustedDelay - elapsed;
                    if (remaining < 0) remaining = 0;
                    
                    timer.nativeId = realSetTimeout(timer.fn, remaining, ...timer.args);
                    timer.cleanupId = realSetTimeout(() => {
                        activeTimers.delete(myId);
                    }, remaining);
                }
            }
        }
    });

    // Override setInterval
    window.setInterval = function (fn, delay, ...args) {
        const myId = nextTimerId++;
        const originalDelay = delay || 0;
        const adjustedDelay = Math.max(originalDelay, MIN_DELAY);
        
        const nativeId = realSetInterval(fn, adjustedDelay, ...args);
        
        activeTimers.set(myId, {
            nativeId: nativeId,
            isInterval: true,
            fn: fn,
            originalDelay: originalDelay,
            args: args,
            startTime: Date.now()
        });
        return myId;
    };

    // Override clearInterval
    window.clearInterval = function (id) {
        const timer = activeTimers.get(id);
        if (timer) {
            realClearInterval(timer.nativeId);
            activeTimers.delete(id);
        } else {
            realClearInterval(id);
        }
    };

    // Override setTimeout
    window.setTimeout = function (fn, delay, ...args) {
        const myId = nextTimerId++;
        const originalDelay = delay || 0;
        const adjustedDelay = Math.max(originalDelay, MIN_DELAY);
        
        const nativeId = realSetTimeout(fn, adjustedDelay, ...args);
        
        // Parallel cleanup timer so we don't leak memory and don't need to wrap the user's `fn`
        const cleanupId = realSetTimeout(() => {
            activeTimers.delete(myId);
        }, adjustedDelay);
        
        activeTimers.set(myId, {
            nativeId: nativeId,
            isInterval: false,
            fn: fn,
            originalDelay: originalDelay,
            args: args,
            startTime: Date.now(),
            cleanupId: cleanupId
        });
        return myId;
    };

    // Override clearTimeout
    window.clearTimeout = function (id) {
        const timer = activeTimers.get(id);
        if (timer) {
            realClearTimeout(timer.nativeId);
            if (timer.cleanupId) realClearTimeout(timer.cleanupId);
            activeTimers.delete(id);
        } else {
            realClearTimeout(id);
        }
    };

    //................................................................................
    // Debug helpers

    // Show active interval timers
    window.listIntervals = function () {
        const result = [];
        const now = Date.now();

        activeTimers.forEach(function (info, id_value) {
            if (info.isInterval) {
                result.push({
                    id: id_value,
                    delay: info.originalDelay,
                    adjustedDelay: Math.max(info.originalDelay, MIN_DELAY),
                    age_ms: now - info.startTime
                });
            }
        });

        return result;
    };

    // Clear all interval timers
    window.clearIntervals = function () {
        for (const [myId, timer] of activeTimers.entries()) {
            if (timer.isInterval) {
                realClearInterval(timer.nativeId);
                activeTimers.delete(myId);
            }
        }
    };


};

setup();
