/// <reference path="../../typings/interfaces.d.ts"/>
define(["require", "exports", '../types'], function (require, exports, types) {
    "use strict";
    var KEYS = types.KEYS;
    var KeyboardInput = (function () {
        function KeyboardInput() {
        }
        Object.defineProperty(KeyboardInput, "Name", {
            get: function () {
                return 'Foo._name';
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(KeyboardInput, "getObservable", {
            get: function () {
                var keydown = Rx.Observable.fromEvent(document, 'keydown');
                var touchStart = Rx.Observable.fromEvent(document, 'touchstart');
                // translate to <-- and -->
                var touchTranslated = touchStart.map(function (e) {
                    try {
                        var pageX = e.touches[0].pageX;
                        var isLeftSide = pageX < window.innerWidth / 2;
                        return isLeftSide ? KEYS.LEFT : KEYS.RIGHT;
                    }
                    catch (err) {
                        alert('touch translation problem:' + err.message);
                    }
                    return null;
                });
                var keyDownTranslated = keydown
                    .map(function (e) {
                    return e.keyCode;
                })
                    .filter(function (keyCode) { return (KeyboardInput.KEY_MAP[keyCode] !== undefined); })
                    .map(function (keyCode) { return (KeyboardInput.KEY_MAP[keyCode]); });
                return Rx.Observable.merge(keyDownTranslated, touchTranslated)
                    .filter(function (key) { return (key !== null); });
            },
            enumerable: true,
            configurable: true
        });
        KeyboardInput.KEY_MAP = {
            37: KEYS.LEFT,
            38: KEYS.UP,
            39: KEYS.RIGHT,
            40: KEYS.DOWN,
            65: KEYS.A,
            67: KEYS.C,
            77: KEYS.M,
            68: KEYS.D,
            90: KEYS.Z,
            48: KEYS.ZERO,
            49: KEYS.ONE,
            50: KEYS.TWO,
            51: KEYS.THREE,
            52: KEYS.FOUR,
        };
        return KeyboardInput;
    }());
    ;
    return KeyboardInput;
});
