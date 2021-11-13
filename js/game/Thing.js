/// <reference path="../../typings/Interfaces.d.ts" />
define(["require", "exports"], function (require, exports) {
    "use strict";
    /**
     * use static counter for uniq ids
     */
    var createdObjectsCount = 0;
    var Thing = (function () {
        function Thing(type, pos0, w, h) {
            if (w === void 0) { w = 1; }
            if (h === void 0) { h = 1; }
            this.rotation = BABYLON.Vector3.Zero();
            this.scaling = new BABYLON.Vector3(1, 1, 1);
            // render props
            this.parent = null;
            this.id = createdObjectsCount++;
            this.type = type;
            this.pos0 = pos0;
            this.position = pos0.clone();
            this.w = w;
            this.h = h;
        }
        return Thing;
    }());
    return Thing;
});
