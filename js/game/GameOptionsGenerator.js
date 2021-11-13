/// <reference path="../../typings/Interfaces.d.ts" />
define(["require", "exports"], function (require, exports) {
    "use strict";
    var GameOptionsGenerator = (function () {
        function GameOptionsGenerator() {
        }
        GameOptionsGenerator.generate = function () {
            var nextReal = window.nextReal;
            var mapSize = 20 + Math.round(nextReal() * 30);
            var maxHeight = 10 + Math.round(nextReal() * 20);
            var gameOptions = {
                n: mapSize,
                m: mapSize,
                lakeMinSize: 8 + Math.round(nextReal() * 4),
                lakeChance: nextReal() * 0.3,
                wallChance: .4,
                stepCount: 2,
                birthLimit: 4,
                deathLimit: 3,
                maxHeight: maxHeight,
                heightInterpolationCount: 20 + Math.round(nextReal() * 20)
            };
            return gameOptions;
        };
        return GameOptionsGenerator;
    }());
    return GameOptionsGenerator;
});
