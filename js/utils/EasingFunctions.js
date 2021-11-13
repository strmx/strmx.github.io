define(["require", "exports"], function (require, exports) {
    "use strict";
    /*
     * Easing Functions - inspired from http://gizma.com/easing/
     * only considering the t value for the range [0, 1] => [0, 1]
     */
    var EasingFunctions = (function () {
        function EasingFunctions() {
        }
        // no easing, no acceleration
        EasingFunctions.linear = function (t) { return t; };
        ;
        // accelerating from zero velocity
        EasingFunctions.easeInQuad = function (t) { return t * t; };
        ;
        // decelerating to zero velocity
        EasingFunctions.easeOutQuad = function (t) { return t * (2 - t); };
        ;
        // acceleration until halfway, then deceleration
        EasingFunctions.easeInOutQuad = function (t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t; };
        ;
        // accelerating from zero velocity
        EasingFunctions.easeInCubic = function (t) { return t * t * t; };
        ;
        // decelerating to zero velocity
        EasingFunctions.easeOutCubic = function (t) { return (--t) * t * t + 1; };
        ;
        // acceleration until halfway, then deceleration
        EasingFunctions.easeInOutCubic = function (t) { return t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1; };
        ;
        // accelerating from zero velocity
        EasingFunctions.easeInQuart = function (t) { return t * t * t * t; };
        ;
        // decelerating to zero velocity
        EasingFunctions.easeOutQuart = function (t) { return 1 - (--t) * t * t * t; };
        ;
        // acceleration until halfway, then deceleration
        EasingFunctions.easeInOutQuart = function (t) { return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t; };
        ;
        // accelerating from zero velocity
        EasingFunctions.easeInQuint = function (t) { return t * t * t * t * t; };
        ;
        // decelerating to zero velocity
        EasingFunctions.easeOutQuint = function (t) { return 1 + (--t) * t * t * t * t; };
        ;
        // acceleration until halfway, then deceleration
        EasingFunctions.easeInOutQuint = function (t) { return t < .5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t; };
        ;
        return EasingFunctions;
    }());
    ;
    return EasingFunctions;
});
