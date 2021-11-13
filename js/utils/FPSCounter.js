define(["require", "exports"], function (require, exports) {
    "use strict";
    var FPSCounter = (function () {
        function FPSCounter(domElement) {
            this.startTime = performance.now();
            this.prevTime = this.startTime;
            this.frames = 0;
            this.prevFPS = -1;
            this.fps = 0;
            this.fpsMin = Infinity;
            this.fpsMax = 0;
            this.domElement = domElement;
        }
        FPSCounter.prototype.begin = function () {
            this.startTime = performance.now();
        };
        FPSCounter.prototype.end = function () {
            var time = performance.now();
            this.frames++;
            if (time > this.prevTime + 1000) {
                this.fps = Math.round((this.frames * 1000) / (time - this.prevTime));
                this.fpsMin = Math.min(this.fpsMin, this.fps);
                this.fpsMax = Math.max(this.fpsMax, this.fps);
                this.prevTime = time;
                this.frames = 0;
                // update dom
                if (this.domElement && this.prevFPS !== this.fps) {
                    this.prevFPS = this.fps;
                    this.domElement.textContent = '' + this.fps;
                }
            }
            return time;
        };
        return FPSCounter;
    }());
    return FPSCounter;
});
