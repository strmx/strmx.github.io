/// <reference path="../../typings/Interfaces.d.ts" />
define(["require", "exports", './Thing', '../map/PatternHelper', '../types'], function (require, exports, Thing, PatternHelper, types) {
    "use strict";
    var V3 = BABYLON.Vector3;
    var ThingType = types.ThingType;
    function correctOutOfBounds(thing, realScale, viewScale, n, m) {
        if (thing.position.y < 0) {
            if (viewScale > realScale) {
                var x = thing.position.x;
                var z = thing.position.z;
                thing.position.y = thing.pos0.y = 0;
                thing.scaling.x = thing.scaling.z = realScale;
            }
        }
    }
    var GameData = (function () {
        function GameData(spec, playground) {
            this.spec = spec;
            this.playground = playground;
        }
        GameData.prototype.generateThings = function () {
            var _this = this;
            var nextReal = window.nextReal;
            //
            // initial things
            //
            this.things = [];
            this.thingMap = PatternHelper.createFilled(this.playground.map.length, this.playground.map[0].length, null);
            // ground & walls
            var map = this.playground.map;
            var n = map.length;
            var m = map[0].length;
            // for (let i = 0; i < n; i++) {
            //   for (let j = 0; j < m; j++) {
            //     let value: number = map[i][j];
            //     let type = value === 0 ? ThingType.GROUND : ThingType.WALL;
            //     if (type === ThingType.GROUND) {
            //       let ground = new Thing(type, new V3(i, 0, j));
            //       ground.rotation.x = Math.PI / 2;
            //       this.things.push(ground);
            //     }
            //     // if (type === ThingType.WALL) {
            //     //   let wall = new Thing(type, new V3(i, .5, j));
            //     //   wall.rotation.x = Math.PI / 2;
            //     //   this.things.push(wall);
            //     //   this.thingMap[i][j] = wall;
            //     // }
            //   }
            // }
            // ground
            // let ground = new Thing(ThingType.GROUND, new V3(n / 2, 0,m / 2), n, m);
            // this.things.push(ground);
            // pyramids
            var x, y, z, w, h;
            this.playground.wallRects.forEach(function (rect2d) {
                var wall;
                w = rect2d.w;
                h = rect2d.h;
                x = rect2d.x;
                z = rect2d.y;
                var centerX = x + w / 2 - .5;
                var centerZ = z + h / 2 - .5;
                var scale = (w + h) / 2;
                var isOneCellSized = w === 1 && h === 1;
                y = _this.playground.elevationMap[x][z].height;
                // for big objects (>1)
                if (!isOneCellSized) {
                    // pyramids
                    var tl = _this.playground.elevationMap[x][z].height;
                    var tr = _this.playground.elevationMap[x + w - 1][z].height;
                    var br = _this.playground.elevationMap[x + w - 1][z + h - 1].height;
                    var bl = _this.playground.elevationMap[x][z + h - 1].height;
                    y = Math.min(tl, tr, br, bl);
                    // put underground
                    y -= .25;
                    var viewScale = scale + .25;
                    wall = new Thing(ThingType.MOUNTAIN, new V3(centerX, y, centerZ));
                    wall.scaling.x = wall.scaling.y = wall.scaling.z = viewScale;
                    wall.scaling.y = scale * (2 + nextReal());
                    correctOutOfBounds(wall, scale, viewScale, n, m);
                    // update thingMap
                    for (var i = x; i < x + w; i++) {
                        for (var j = z; j < z + h; j++) {
                            _this.thingMap[i][j] = wall;
                        }
                    }
                }
                else {
                    if (nextReal() < .5) {
                        // fir
                        scale = .6 + (nextReal() * .6);
                        wall = new Thing(ThingType.FIR, new V3(centerX, y, centerZ));
                        // put underground
                        wall.position.y -= .5;
                        wall.scaling.x = wall.scaling.z = scale;
                        wall.scaling.y = scale * (4 + nextReal() * 3);
                        correctOutOfBounds(wall, 1, scale, n, m);
                        // rotate if doesn't fill full rect
                        if (wall.scaling.z < 1.1 && wall.position.y > 1) {
                            wall.rotation.y = (360 * nextReal()) * (Math.PI / 180);
                        }
                        wall.rotation.x = (nextReal() * 20 - 10) * (Math.PI / 180);
                        wall.rotation.y = (nextReal() * 20 - 10) * (Math.PI / 180);
                    }
                    else {
                        // tree
                        scale = .9 + (1.5 * nextReal());
                        wall = new Thing(ThingType.TREE, new V3(centerX, y, centerZ));
                        // put underground
                        wall.position.y -= .1;
                        wall.scaling.x = wall.scaling.y = wall.scaling.z = scale;
                        wall.rotation.y = (360 * nextReal()) * (Math.PI / 180);
                        wall.rotation.x = (nextReal() * 20 - 10) * (Math.PI / 180);
                        wall.rotation.y = (nextReal() * 20 - 10) * (Math.PI / 180);
                    }
                    _this.thingMap[wall.pos0.x][wall.pos0.z] = wall;
                }
                _this.things.push(wall);
            });
            // add lake cells to things
            // this.playground.lakes.forEach((area: LakeArea) => {
            //   this.things.push();
            //   area.cells.forEach((p: Point) => {
            //   });
            // });
            // agent bear
            var pos2d = this.playground.startPoints[0];
            var agentPos = new V3(pos2d.x, this.playground.elevationMap[pos2d.x][pos2d.y].height, pos2d.y);
            var agent = new Thing(ThingType.BEAR, agentPos);
            agent.scaling.x = agent.scaling.y = agent.scaling.z = 1; //1;
            this.things.push(agent);
            agent.rotation.y = 0;
            this.thingMap[agent.pos0.x][agent.pos0.z] = agent;
            // hives & bees
            this.playground.startPoints.slice(1).forEach(function (pos2d) {
                // agentPath should be > 1 (betwen bear and hive)
                if (Math.abs(agent.pos0.x - pos2d.x) >= 1 && Math.abs(agent.pos0.z - pos2d.y) >= 1) {
                    var companion = new Thing(ThingType.HIVE, new V3(pos2d.x, _this.playground.elevationMap[pos2d.x][pos2d.y].height, pos2d.y));
                    companion.scaling.x = companion.scaling.y = companion.scaling.z = nextReal() * .25 + .75;
                    _this.thingMap[companion.pos0.x][companion.pos0.z] = companion;
                    _this.things.push(companion);
                }
            });
        };
        return GameData;
    }());
    return GameData;
});
