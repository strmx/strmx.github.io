define(["require", "exports"], function (require, exports) {
    "use strict";
    var DistancePoint = (function () {
        function DistancePoint(x, y, distance) {
            this.x = x;
            this.y = y;
            this.distance = distance;
        }
        return DistancePoint;
    }());
    var RectArea = (function () {
        function RectArea(id, x, y, w, h) {
            this.id = id;
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        }
        return RectArea;
    }());
    var FreeAroundPoint = (function () {
        function FreeAroundPoint(x, y, radius, distance) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.distance = distance;
        }
        FreeAroundPoint.prototype.distanceTo = function (point) {
            var dx = point.x - this.x;
            var dy = point.y - this.y;
            return Math.sqrt(dx * dx + dy * dy);
        };
        return FreeAroundPoint;
    }());
    var Bypass = (function () {
        function Bypass(radiusLimit) {
            this.points = [];
            this.radiusLimit = radiusLimit;
            this.generateBypassShifts();
        }
        Object.defineProperty(Bypass.prototype, "length", {
            get: function () {
                return this.points.length;
            },
            enumerable: true,
            configurable: true
        });
        /*
          89->.
          .012.
          .7 3.
          .654.
          .....
        */
        Bypass.prototype.generateBypassShifts = function () {
            var radiusLimit = this.radiusLimit;
            var cx, cy;
            for (var radius = 1; radius < radiusLimit; radius++) {
                // TL->TR
                cy = -radius;
                for (cx = -radius; cx <= radius; cx++) {
                    this.points.push(new FreeAroundPoint(cx, cy, radius, Math.sqrt(cx * cx + cy * cy)));
                }
                // TR->BR
                cx = radius;
                for (cy = -radius + 1; cy <= radius; cy++) {
                    this.points.push(new FreeAroundPoint(cx, cy, radius, Math.sqrt(cx * cx + cy * cy)));
                }
                // BR->BL
                cy = radius;
                for (cx = radius - 1; cx >= -radius; cx--) {
                    this.points.push(new FreeAroundPoint(cx, cy, radius, Math.sqrt(cx * cx + cy * cy)));
                }
                // BL->TL
                cx = -radius;
                for (cy = radius - 1; cy >= -radius + 1; cy--) {
                    this.points.push(new FreeAroundPoint(cx, cy, radius, Math.sqrt(cx * cx + cy * cy)));
                }
            }
        };
        return Bypass;
    }());
    var PatternHelper = (function () {
        function PatternHelper() {
        }
        PatternHelper.createFilled = function (n, m, defautValue) {
            var pattern = [];
            var count = 0;
            for (var i = 0; i < n; i++) {
                var col = [];
                pattern[i] = col;
                for (var j = 0; j < m; j++) {
                    count++;
                    col[j] = defautValue;
                }
            }
            return pattern;
        };
        PatternHelper.fillUniform = function (pattern, chance, randomFunction, fillValue) {
            var n = pattern.length;
            var m = pattern[0].length;
            var count = 0;
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < m; j++) {
                    // TODO: implement radius based border chance
                    if (randomFunction() < chance) {
                        count++;
                        pattern[i][j] = fillValue;
                    }
                }
            }
        };
        PatternHelper.countNotEmptyNeighbours = function (pattern, x, y) {
            var n = pattern.length;
            var m = pattern[0].length;
            var neighbourX, neighbourY;
            var outOfBound;
            var neighbourCount = 0;
            for (var i = -1; i < 2; i++) {
                for (var j = -1; j < 2; j++) {
                    // skip self
                    if (i !== 0 || j !== 0) {
                        neighbourX = x + i;
                        neighbourY = y + j;
                        outOfBound = neighbourX < 0 || neighbourY < 0 || neighbourX >= n || neighbourY >= m;
                        if (outOfBound || pattern[neighbourX][neighbourY] !== 0) {
                            neighbourCount++;
                        }
                    }
                }
            }
            return neighbourCount;
        };
        // flood into fillPattern (w/o diagonal)
        PatternHelper.floodFill = function (pattern, x, y, checkedPattern, typeValue) {
            var filledCells = [];
            var n = pattern.length;
            var m = pattern[0].length;
            var i, j, cx, cy;
            var cellsToCheckX = [x];
            var cellsToCheckY = [y];
            var newCellsToCheckX = [];
            var newCellsToCheckY = [];
            while (cellsToCheckX.length) {
                newCellsToCheckX = [];
                newCellsToCheckY = [];
                for (i = cellsToCheckX.length - 1; i >= 0; i--) {
                    cx = cellsToCheckX[i];
                    cy = cellsToCheckY[i];
                    if (cx >= 0 && cy >= 0 && cx < n && cy < m) {
                        // if empty and was not checked before
                        if (checkedPattern[cx][cy] === false && pattern[cx][cy] === typeValue) {
                            // mark as flooded
                            checkedPattern[cx][cy] = true;
                            filledCells.push({ x: cx, y: cy });
                            // check top
                            newCellsToCheckX.push(cx);
                            newCellsToCheckY.push(cy - 1);
                            // check right
                            newCellsToCheckX.push(cx + 1);
                            newCellsToCheckY.push(cy);
                            // check bottom
                            newCellsToCheckX.push(cx);
                            newCellsToCheckY.push(cy + 1);
                            // check left
                            newCellsToCheckX.push(cx - 1);
                            newCellsToCheckY.push(cy);
                        }
                    }
                }
                cellsToCheckX = newCellsToCheckX;
                cellsToCheckY = newCellsToCheckY;
            }
            return filledCells;
        };
        PatternHelper.calculateFreeAroundRadius = function (x, y, pattern, bypass) {
            var n = pattern.length;
            var m = pattern[0].length;
            var bPoint;
            var cx, cy;
            var checkCollision = function (x, y) {
                return (x < 0 || y < 0 || x >= n || y >= m) || (pattern[x][y] !== 0);
            };
            for (var i = 0, l = bypass.length; i < l; i++) {
                bPoint = bypass.points[i];
                cx = x + bPoint.x;
                cy = y + bPoint.y;
                if (checkCollision(cx, cy)) {
                    var nearestPoint = bPoint;
                    // check other point with same radius
                    for (var j = i + 1; j < l; j++) {
                        bPoint = bypass.points[j];
                        if (bPoint.radius === nearestPoint.radius) {
                            cx = x + bPoint.x;
                            cy = y + bPoint.y;
                            if (checkCollision(cx, cy)) {
                                if (bPoint.distance < nearestPoint.distance) {
                                    nearestPoint = bPoint;
                                }
                            }
                        }
                        else {
                            return nearestPoint.distance;
                        }
                    }
                }
            }
            return 0;
        };
        PatternHelper.generateBypass = function (pattern) {
            return new Bypass(Math.max(pattern.length, pattern[0].length));
        };
        PatternHelper.collectFreeAroundPositions = function (pattern, bypass) {
            var n = pattern.length;
            var m = pattern[0].length;
            var freeAroundPositions = [];
            var removedAroundPositions = [];
            // calculate radius for all free points
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < m; j++) {
                    if (pattern[i][j] === 0) {
                        var distance = PatternHelper.calculateFreeAroundRadius(i, j, pattern, bypass);
                        // filter small free areas
                        if (distance > 1) {
                            freeAroundPositions.push(new DistancePoint(i, j, distance));
                        }
                    }
                }
            }
            // biggest radius first
            freeAroundPositions.sort(function (a, b) { return (b.distance - a.distance); });
            // eat smaller points
            var p1, p2;
            var distanceTillCollision, dx, dy, distanceBetweenPoints;
            for (var i = 0, l = freeAroundPositions.length; i < l; i++) {
                if (freeAroundPositions[i]) {
                    p1 = freeAroundPositions[i];
                    distanceTillCollision = p1.distance;
                    for (var j = i + 1; j < l; j++) {
                        if (freeAroundPositions[j]) {
                            p2 = freeAroundPositions[j];
                            dx = p2.x - p1.x;
                            dy = p2.y - p1.y;
                            distanceBetweenPoints = Math.sqrt(dx * dx + dy * dy);
                            if (distanceBetweenPoints < distanceTillCollision) {
                                // eat it
                                removedAroundPositions[j] = p2;
                                freeAroundPositions[j] = null;
                            }
                        }
                    }
                }
            }
            // clear position list
            var positions = [];
            var point;
            for (var i = 0, l = freeAroundPositions.length; i < l; i++) {
                point = freeAroundPositions[i];
                if (point) {
                    positions.push(point);
                }
            }
            return positions;
        };
        // return sorted by size list of open areas
        PatternHelper.findIsolatedAreas = function (pattern, typeValue) {
            var n = pattern.length;
            var m = pattern[0].length;
            var openAreas = [];
            var checkedPattern = PatternHelper.createFilled(n, m, false);
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < m; j++) {
                    if (checkedPattern[i][j] === false && pattern[i][j] === typeValue) {
                        var area = PatternHelper.floodFill(pattern, i, j, checkedPattern, typeValue);
                        openAreas.push(area);
                    }
                }
            }
            // sort by size
            openAreas.sort(function (a, b) { return (b.length - a.length); });
            return openAreas;
        };
        // leave only biggest one on arg: pattern
        // returns list of open area cells
        PatternHelper.removeSmallOpenAreas = function (pattern) {
            var openAreas = PatternHelper.findIsolatedAreas(pattern, 0);
            if (openAreas.length === 0) {
                return null;
            }
            if (openAreas.length > 1) {
                // remove open areas
                openAreas
                    .slice(1)
                    .forEach(function (cells) {
                    cells.forEach(function (pos) {
                        pattern[pos.x][pos.y] = 1;
                    });
                });
            }
            return openAreas[0];
        };
        PatternHelper.calculateRectBlocks = function (pattern, combineValue) {
            var n = pattern.length;
            var m = pattern[0].length;
            var map = this.clone(pattern);
            var biggestRects = [];
            var fillRect = function (map, rectArea) {
                for (var i = rectArea.x, il = rectArea.x + rectArea.w; i < il; i++) {
                    for (var j = rectArea.y, jl = rectArea.y + rectArea.h; j < jl; j++) {
                        // set just not same value to mark it as used
                        map[i][j] = combineValue + 1;
                    }
                }
            };
            var calculateBiggestSide = function (map, x, y) {
                var cx;
                var cy;
                for (var sideLength = 1; sideLength < n; sideLength++) {
                    // TODO: think about get rid of double checking of the last cell on the last loop iteration
                    for (var i = 0; i <= sideLength; i++) {
                        // next row
                        cx = x + sideLength;
                        cy = y + i;
                        if ((cx >= n || cy >= m) || (map[cx][cy] !== combineValue)) {
                            return sideLength;
                        }
                        // next col
                        cx = x + i;
                        cy = y + sideLength;
                        if ((cx >= n || cy >= m) || (map[cx][cy] !== combineValue)) {
                            return sideLength;
                        }
                    }
                }
                return 1;
            };
            // collect big rects
            // started from biggest
            var iterationCount = 0;
            while (iterationCount++ < 1000) {
                var bigX = 0;
                var bigY = 0;
                var bigR = 0;
                var currR = 0;
                // find biggest rect area
                for (var i = 0; i < n; i++) {
                    for (var j = 0; j < m; j++) {
                        if (map[i][j] === combineValue) {
                            currR = calculateBiggestSide(map, i, j);
                            if (currR > bigR) {
                                bigX = i;
                                bigY = j;
                                bigR = currR;
                            }
                        }
                    }
                }
                if (bigR > 1) {
                    // add rects bigger than 1 cell
                    var rect = new RectArea(biggestRects.length, bigX, bigY, bigR, bigR);
                    fillRect(map, rect);
                    biggestRects.push(rect);
                }
                else {
                    // stop if biggest = 1 cell
                    // to skip small (performance++)
                    break;
                }
            }
            // create 1 cell rects (that were skipped)
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < m; j++) {
                    if (map[i][j] === combineValue) {
                        biggestRects.push(new RectArea(biggestRects.length, i, j, 1, 1));
                    }
                }
            }
            return biggestRects;
        };
        //
        // ELEVATIONS
        //
        PatternHelper.generateHeightMap = function (n, m, interpolationCount, shouldBeFlatCells) {
            var nextReal = window.nextReal;
            var map = PatternHelper.createFilled(n, m, 0);
            var count = 0;
            var halfN = n / 2;
            var halfM = m / 2;
            var chance = 0;
            var maxElevation;
            var maxRadius = Math.sqrt(halfN * halfN + halfM * halfM);
            var cx, cy;
            // add random heighest point
            for (var i = 0; i < n; i++) {
                cx = halfN - i;
                // heighest in the center
                for (var j = 0; j < m; j++) {
                    if (i === 0 || j === 0 || i === n - 1 || j === m - 1) {
                        map[i][j] = 0;
                    }
                    else if (nextReal() < .45) {
                        cy = halfM - j;
                        maxElevation = 1 - (Math.sqrt(cx * cx + cy * cy) / maxRadius);
                        map[i][j] = maxElevation * nextReal();
                    }
                }
            }
            // map[22][96] = .25;
            var flatMap = PatternHelper.createFilled(n, m, false);
            shouldBeFlatCells.forEach(function (p) {
                var x = p.x;
                var y = p.y;
                flatMap[x][y] = true;
                if (x > 0 && y > 0)
                    flatMap[x - 1][y - 1] = true;
                if (y > 0)
                    flatMap[x][y - 1] = true;
                if (x < n - 1 && y > 0)
                    flatMap[x + 1][y - 1] = true;
                if (x < n - 1)
                    flatMap[x + 1][y] = true;
                if (x < n - 1 && y < m - 1)
                    flatMap[x + 1][y + 1] = true;
                if (y < m - 1)
                    flatMap[x][y + 1] = true;
                if (x > 0 && y < m - 1)
                    flatMap[x - 1][y + 1] = true;
            });
            // function isFlatNeighbour(x: number, y: number) {
            //   if (i === 0 || j === 0 || i === n - 1 || j === m - 1) {
            //     map[i][j] = 0;
            //   } else {
            // }
            // // interpolate
            // // 8 cells around cell - TL>TR>BR>BL>TL
            var lx, rx, ty, by, v;
            for (var iter = 0; iter < interpolationCount; iter++) {
                map = this.smoothHeightMap(map, flatMap);
            }
            return map;
        };
        PatternHelper.smoothHeightMap = function (heightMap, flatMap, skipZero) {
            if (skipZero === void 0) { skipZero = false; }
            var n = heightMap.length;
            var m = heightMap[0].length;
            var lx, rx, ty, by, v;
            var smoothedMap = PatternHelper.createFilled(n, m, 0);
            var cellHeight, minHeight, maxHeight;
            var xi, yi, iHeight;
            var heightSum, heighCount;
            for (var i = 0; i < n; i++) {
                lx = i - 1 < 0 ? i : i - 1;
                rx = i + 1 >= n ? i : i + 1;
                for (var j = 0; j < m; j++) {
                    ty = j - 1 < 0 ? j : j - 1;
                    by = j + 1 >= m ? j : j + 1;
                    cellHeight = heightMap[i][j];
                    if (i === 0 || j === 0 || i === n - 1 || j === m - 1 || (flatMap && flatMap[i][j]) || (skipZero && cellHeight === 0)) {
                        smoothedMap[i][j] = 0;
                    }
                    else {
                        maxHeight = cellHeight;
                        minHeight = cellHeight;
                        heightSum = 0;
                        heighCount = 0;
                        for (xi = lx; xi <= rx; xi++) {
                            for (yi = ty; yi <= by; yi++) {
                                iHeight = heightMap[xi][yi];
                                heighCount++;
                                heightSum += iHeight;
                                if (iHeight > maxHeight) {
                                    maxHeight = iHeight;
                                }
                                if (iHeight < minHeight) {
                                    minHeight = iHeight;
                                }
                            }
                        }
                        // smoothedMap[i][j] = (minHeight + maxHeight) * .5;
                        smoothedMap[i][j] = heightSum / heighCount;
                    }
                }
            }
            return smoothedMap;
        };
        //
        // TOOLS
        //
        PatternHelper.numberMapToUint8Array = function (map, multiplier) {
            if (multiplier === void 0) { multiplier = 255; }
            var tMap = PatternHelper.transpose(map);
            var n = tMap.length;
            var m = tMap[0].length;
            var total = n * m * 4;
            var im, j4;
            var bufferSource = [];
            var color;
            // for (let i = 0; i < n; i++) {
            for (var i = 0; i < n; i++) {
                im = i * m * 4;
                for (var j = 0; j < m; j++) {
                    j4 = j * 4;
                    color = tMap[n - i - 1][j];
                    // bufferSource[im + j4] = color | (color << 8) | (color << 16);
                    bufferSource[im + j4] = color * multiplier;
                    bufferSource[im + j4 + 1] = color * multiplier;
                    bufferSource[im + j4 + 2] = color * multiplier;
                    bufferSource[im + j4 + 3] = 255;
                }
            }
            return new Uint8Array(bufferSource);
        };
        PatternHelper.clone = function (pattern) {
            return pattern.map(function (col) { return (col.map(function (cell) { return (cell); })); });
        };
        PatternHelper.transpose = function (pattern) {
            return pattern[0].map(function (col, i) {
                return pattern.map(function (row) {
                    return row[i];
                });
            });
        };
        PatternHelper.stringify = function (pattern, notParsable) {
            var transposedPattern = PatternHelper.transpose(pattern);
            if (notParsable) {
                return transposedPattern
                    .map(function (row) {
                    return row.map(function (cell) {
                        if (cell === 0) {
                            return '-';
                        }
                        if (cell === 1) {
                            return '+';
                        }
                        return Math.abs(cell);
                    });
                })
                    .map(function (col) { return (col.join('')); }).join('\n')
                    .replace(/\-/g, '░')
                    .replace(/\+/g, '█');
            }
            return transposedPattern.map(function (col) { return (col.join('')); }).join('\n')
                .replace(/0/g, '░')
                .replace(/1/g, '█');
        };
        PatternHelper.parse = function (text) {
            var rows = text.split('\n');
            if (!rows.length || !rows[0] || !rows[0].length) {
                return null;
            }
            var n = rows[0].length;
            var m = rows.length;
            var pattern = PatternHelper.createFilled(n, m, 0);
            rows.forEach(function (rows, j) {
                rows.split('').forEach(function (val, i) {
                    var cellValue;
                    if (val === '░')
                        cellValue = 0;
                    else if (val === '█')
                        cellValue = 1;
                    else
                        cellValue = parseInt(val, 10);
                    pattern[i][j] = cellValue;
                });
            });
            return pattern;
        };
        return PatternHelper;
    }());
    return PatternHelper;
});
