/// <reference path="../../typings/interfaces.d.ts"/>
define(["require", "exports"], function (require, exports) {
    "use strict";
    var CSS_STYLES = "\n  position: absolute;\n  width: 100%;\n  height: 100%;\n";
    var CanvasElement = (function () {
        function CanvasElement(parent) {
            this.canvas = document.querySelector('canvas');
            // this.canvas = document.createElement('canvas');
            // this.canvas.setAttribute('style', CSS_STYLES);
            // parent.appendChild(this.canvas);
        }
        Object.defineProperty(CanvasElement.prototype, "element", {
            get: function () {
                return this.canvas;
            },
            enumerable: true,
            configurable: true
        });
        CanvasElement.prototype.destroy = function () {
            this.canvas.parentElement.removeChild(this.canvas);
        };
        CanvasElement.prototype.resize = function (w, h) {
            this.canvas.height = w || window.innerHeight;
            this.canvas.width = h || window.innerWidth;
        };
        return CanvasElement;
    }());
    return CanvasElement;
});
