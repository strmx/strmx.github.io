define(["require", "exports", './PatternHelper'], function (require, exports, PatternHelper) {
    "use strict";
    var CELL_TYPE;
    (function (CELL_TYPE) {
        CELL_TYPE[CELL_TYPE["WALL"] = 1] = "WALL";
        CELL_TYPE[CELL_TYPE["ROAD"] = 0] = "ROAD";
    })(CELL_TYPE || (CELL_TYPE = {}));
    ;
    // const DEFAULT_OPTIONS = {
    //   n: 100,
    //   m: 100,
    //   wallChance: .4,
    //   stepCount: 2,
    //   birthLimit: 4,
    //   deathLimit: 3,
    // };
    var CavePatternGenerator = (function () {
        function CavePatternGenerator() {
        }
        CavePatternGenerator.generateCavePattern = function (options) {
            var nextReal = window.nextReal;
            var pattern = PatternHelper.createFilled(options.n, options.m, CELL_TYPE.ROAD);
            PatternHelper.fillUniform(pattern, options.wallChance, nextReal, CELL_TYPE.WALL);
            for (var i = 0; i < options.stepCount; i++) {
                pattern = CavePatternGenerator.applyCAStep(pattern, options.birthLimit, options.deathLimit);
            }
            return pattern;
        };
        // Cellular Automaton Step
        CavePatternGenerator.applyCAStep = function (pattern, birthLimit, deathLimit) {
            if (!pattern || !pattern.length || !pattern[0] || !pattern[0].length) {
                return null;
            }
            var n = pattern.length;
            var m = pattern[0].length;
            var neighbourCount = 0;
            var nextStepPattern = PatternHelper.createFilled(n, m, 0);
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < m; j++) {
                    neighbourCount = PatternHelper.countNotEmptyNeighbours(pattern, i, j);
                    if (pattern[i][j] === CELL_TYPE.WALL) {
                        if (neighbourCount < deathLimit) {
                            nextStepPattern[i][j] = CELL_TYPE.ROAD;
                        }
                        else {
                            nextStepPattern[i][j] = CELL_TYPE.WALL;
                        }
                    }
                    else {
                        if (neighbourCount > birthLimit) {
                            nextStepPattern[i][j] = CELL_TYPE.WALL;
                        }
                        else {
                            nextStepPattern[i][j] = CELL_TYPE.ROAD;
                        }
                    }
                }
            }
            return nextStepPattern;
        };
        return CavePatternGenerator;
    }());
    return CavePatternGenerator;
});
