/// <reference path="../../typings/Interfaces.d.ts" />
define(["require", "exports", './CavePatternGenerator', './LakeGenerator', './PatternHelper', './Elevation', '../types'], function (require, exports, CavePatternGenerator, LakeGenerator, PatternHelper, Elevation, types) {
    "use strict";
    var WORLD_OBJECT = types.ThingType;
    var V2 = BABYLON.Vector2;
    var V3 = BABYLON.Vector3;
    var Playground = (function () {
        function Playground(spec) {
            var nextReal = window.nextReal;
            var n = spec.n, m = spec.m;
            // initialise cave pattern
            var pattern = CavePatternGenerator.generateCavePattern(spec);
            // free around cells
            for (var i = 0; i < spec.n; i++) {
                if (nextReal() > .05)
                    pattern[i][0] = 0;
                if (nextReal() > .05)
                    pattern[i][m - 1] = 0;
            }
            for (var i = 0; i < spec.n; i++) {
                if (nextReal() > .05)
                    pattern[0][i] = 0;
                if (nextReal() > .05)
                    pattern[n - 1][i] = 0;
            }
            var bypass = PatternHelper.generateBypass(pattern);
            PatternHelper.removeSmallOpenAreas(pattern);
            // boundaries
            // scale 2
            // (dirty way to get rid of unreachable cells)
            // let boundaries = PatternHelper.clone(this.map);
            // let boundaries = PatternHelper.createFilled(n * 2, m * 2, 0);
            // for (let i = 0; i < n; i++) {
            //   for (let j = 0; j < m; j++) {
            //     let value = this.map[i][j];
            //     let i2 = i * 2;
            //     let j2 = j * 2;
            //     boundaries[i2][j2] = value;
            //     boundaries[i2 + 1][j2] = value;
            //     boundaries[i2][j2 + 1] = value;
            //     boundaries[i2 + 1][j2 + 1] = value;
            //   }
            // }
            this.maxHeight = spec.maxHeight;
            this.map = PatternHelper.clone(pattern);
            this.lakes = LakeGenerator.generateLakes(this.map, spec.lakeChance, spec.lakeMinSize);
            // combine all lake maps
            var lakesCells = [];
            this.lakes.forEach(function (lake) {
                lakesCells = lakesCells.concat(lake.cells);
            });
            this.heightMap = PatternHelper.generateHeightMap(n, m, spec.heightInterpolationCount, lakesCells);
            // this.elevationMap = this._generateElevations(this.heightMap, this.maxHeight, spec);
            // this.map3d = this._generate3DMap(this.elevationMap);
            this.wallRects = PatternHelper.calculateRectBlocks(this.map, 1);
            this.boundaries = PatternHelper.clone(pattern);
            this.startPoints = PatternHelper.collectFreeAroundPositions(pattern, bypass);
        }
        Playground.prototype.updateElevationMap = function (surfaceMesh) {
            var n = this.heightMap.length;
            var m = this.heightMap[0].length;
            var scene = surfaceMesh.getScene();
            var yPosMap = PatternHelper.createFilled(n, m, 0);
            var intersectionDirection = new BABYLON.Vector3(0, -1, 0);
            var intersectionPos = new BABYLON.Vector3(0, this.maxHeight + 1, 0);
            var rayPick;
            var pickInfo;
            var el;
            // let cubeBlueprint = BABYLON.Mesh.CreateBox('b', .1, scene);
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < m; j++) {
                    intersectionPos.x = i - surfaceMesh.position.x;
                    intersectionPos.z = j - surfaceMesh.position.z;
                    rayPick = new BABYLON.Ray(intersectionPos, intersectionDirection);
                    pickInfo = surfaceMesh.intersects(rayPick, true);
                    // console.log(intersectionPos)
                    if (pickInfo && pickInfo.pickedPoint) {
                        yPosMap[i][j] = pickInfo.pickedPoint.y;
                    }
                    else {
                        console.error('out of surf', i, j);
                    }
                }
            }
            // update
            this.elevationMap = this._generateElevations(yPosMap);
            this.map3d = this._generate3DMap(this.elevationMap);
        };
        Playground.prototype._generate3DMap = function (elevationMap) {
            var n = elevationMap.length;
            var m = elevationMap[0].length;
            var map3d = [];
            for (var i = 0; i < n; i++) {
                var row = [];
                for (var j = 0; j < m; j++) {
                    var pos = new BABYLON.Vector3(i, elevationMap[i][j].height, j);
                    row.push({
                        pos: pos,
                        directionTop: null,
                        directionRight: null,
                        directionBottom: null,
                        directionLeft: null,
                    });
                }
                map3d.push(row);
            }
            // calculate directions
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < m; j++) {
                    var cell3d = map3d[i][j];
                    // top
                    if (j > 0) {
                        // TODO: findout why it's inverted (directionBottom/directionTop)
                        cell3d.directionBottom = map3d[i][j - 1].pos.subtract(cell3d.pos);
                    }
                    // right
                    if (i < n - 1) {
                        cell3d.directionRight = map3d[i + 1][j].pos.subtract(cell3d.pos);
                    }
                    // bottom
                    if (j < m - 1) {
                        // TODO: findout why it's inverted (directionBottom/directionTop)
                        cell3d.directionTop = map3d[i][j + 1].pos.subtract(cell3d.pos);
                    }
                    // left
                    if (i > 0) {
                        cell3d.directionLeft = map3d[i - 1][j].pos.subtract(cell3d.pos);
                    }
                }
            }
            return map3d;
        };
        Playground.prototype._generateElevations = function (yPosMap) {
            var n = yPosMap.length;
            var m = yPosMap[0].length;
            var elevationMap = [];
            for (var i = 0; i < n; i++) {
                var row = [];
                for (var j = 0; j < m; j++) {
                    row.push(new Elevation(yPosMap[i][j], i, j));
                }
                elevationMap.push(row);
            }
            // update heighbors
            for (var i = 0; i < n; i++) {
                for (var j = 0; j < m; j++) {
                    elevationMap[i][j].updateNeighbors(elevationMap);
                }
            }
            return elevationMap;
        };
        return Playground;
    }());
    return Playground;
});
