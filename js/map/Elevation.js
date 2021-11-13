define(["require", "exports"], function (require, exports) {
    "use strict";
    var Elevation = (function () {
        function Elevation(height, x, y) {
            this.neighbors = [];
            this.x = x;
            this.y = y;
            this.height = height;
        }
        // top, right, bottom, left
        Elevation.prototype.updateNeighbors = function (elevationMap) {
            var leftCol = elevationMap[this.x - 1] || [];
            var rightCol = elevationMap[this.x + 1] || [];
            this.neighbors.push(elevationMap[this.x][this.y - 1] || null);
            this.neighbors.push(rightCol[this.y] || null);
            this.neighbors.push(elevationMap[this.x][this.y + 1] || null);
            this.neighbors.push(leftCol[this.y] || null);
        };
        return Elevation;
    }());
    return Elevation;
});
