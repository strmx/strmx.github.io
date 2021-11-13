/// <reference path="../../typings/interfaces.d.ts"/>
define(["require", "exports"], function (require, exports) {
    "use strict";
    // use vendors - https://github.com/ckknight/random-js
    var Randomizer = (function () {
        function Randomizer() {
        }
        Randomizer.generateNextIntFunction = function (min, max, seed) {
            var randomEngine = Random.engines.mt19937().seed(seed);
            var distribution = Random.integer(min, max);
            return function () { return (distribution(randomEngine)); };
        };
        Randomizer.generateNextRealFunction = function (seed) {
            var randomEngine = Random.engines.mt19937().seed(seed);
            var distribution = Random.real(0, 1, false);
            return function () { return (distribution(randomEngine)); };
        };
        return Randomizer;
    }());
    ;
    return Randomizer;
});
