define(["require", "exports"], function (require, exports) {
    "use strict";
    var KEYS;
    (function (KEYS) {
        KEYS[KEYS["LEFT"] = 0] = "LEFT";
        KEYS[KEYS["UP"] = 1] = "UP";
        KEYS[KEYS["RIGHT"] = 2] = "RIGHT";
        KEYS[KEYS["DOWN"] = 3] = "DOWN";
        KEYS[KEYS["A"] = 4] = "A";
        KEYS[KEYS["C"] = 5] = "C";
        KEYS[KEYS["D"] = 6] = "D";
        KEYS[KEYS["M"] = 7] = "M";
        KEYS[KEYS["Z"] = 8] = "Z";
        KEYS[KEYS["ZERO"] = 9] = "ZERO";
        KEYS[KEYS["ONE"] = 10] = "ONE";
        KEYS[KEYS["TWO"] = 11] = "TWO";
        KEYS[KEYS["THREE"] = 12] = "THREE";
        KEYS[KEYS["FOUR"] = 13] = "FOUR";
    })(KEYS || (KEYS = {}));
    var ThingType;
    (function (ThingType) {
        ThingType[ThingType["SKY"] = 0] = "SKY";
        ThingType[ThingType["GROUND"] = 1] = "GROUND";
        ThingType[ThingType["MOUNTAIN"] = 2] = "MOUNTAIN";
        ThingType[ThingType["BEAR"] = 3] = "BEAR";
        ThingType[ThingType["HIVE"] = 4] = "HIVE";
        ThingType[ThingType["BEE"] = 5] = "BEE";
        ThingType[ThingType["FIR"] = 6] = "FIR";
        ThingType[ThingType["TREE"] = 7] = "TREE";
    })(ThingType || (ThingType = {}));
    return {
        KEYS: KEYS,
        ThingType: ThingType
    };
});
