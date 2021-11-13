/// <reference path='../../typings/interfaces.d.ts'/>
define(["require", "exports", '../types', './CanvasElement', '../map/PatternHelper', './CustomMesh'], function (require, exports, types, CanvasElement, PatternHelper, CustomMesh) {
    "use strict";
    var ThingType = types.ThingType;
    var V2 = BABYLON.Vector2;
    var V3 = BABYLON.Vector3;
    var SKY_SIZE = 1000;
    var Renderer = (function () {
        function Renderer(playground) {
            var _this = this;
            this.playground = playground;
            var nextReal = window.nextReal;
            var n = this.playground.map.length;
            var m = this.playground.map[0].length;
            this.canvas = new CanvasElement(document.body);
            // this.canvas.resize();
            this.engine = new BABYLON.Engine(this.canvas.element, true, {}, true);
            this.scene = new BABYLON.Scene(this.engine);
            // [1 - 4] (.5 for retina etc)
            // TODO: make autoadjusted
            this.setScreenScale(1);
            window.addEventListener('resize', function () {
                _this.engine.resize();
                // refreshTextureRatios();
            });
            //
            // LIGHT
            //
            // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
            // let light = new BABYLON.HemisphericLight('light1', new V3(n, 50, m), this.scene);
            // var light = new BABYLON.DirectionalLight('Dir0', new V3(0, -1, 0), this.scene);
            // light.diffuse = new BABYLON.Color3(1, 1, 1);
            // light.specular = new BABYLON.Color3(1, 1, 1);
            // light.intensity = 1; // .7
            var h = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), this.scene);
            h.intensity = 1.25;
            // let directLight = new BABYLON.DirectionalLight('dir', new BABYLON.Vector3(2, 5, 3), this.scene);
            // directLight.position = new BABYLON.Vector3(0, 50, 0);
            // directLight.intensity = 1;
            // var pl = new BABYLON.PointLight('pl', new BABYLON.Vector3(0, 50, 0), this.scene);
            // pl.diffuse = new BABYLON.Color3(1, 1, 1);
            // pl.specular = new BABYLON.Color3(1, 1, 1);
            // pl.intensity = .6; // .8
            //
            // CAMERAS
            //
            // let pos = agentOrigin.position;
            // var agentCamera = new BABYLON.FollowCamera('agentCamera', new V3(pos.x, 10, pos.z), this.scene);
            this.camera = new BABYLON.FollowCamera('followCamera', new V3(n / 2, 10, m / 2), this.scene);
            this.camera.radius = 5; // how far from the object to follow
            this.camera.heightOffset = 7; // how high above the object to place the camera
            // this.camera.rotationOffset = 270; // the viewing angle
            this.camera.cameraAcceleration = 0.01; // how fast to move
            this.camera.maxCameraSpeed = .5; // speed limit
            // this.scene.activeCamera = this.camera;
            this.zoomOutCamera = new BABYLON.ArcRotateCamera('zoomOutCamera', 3 * Math.PI / 2, Math.PI / 8, ((n + m) / 2) * 1.1, new BABYLON.Vector3(n / 2, 0, m / 2), this.scene);
            this.zoomOutCamera.attachControl(this.canvas.element, true);
            this.zoomOutCamera.lowerBetaLimit = .2;
            this.zoomOutCamera.upperBetaLimit = (Math.PI * 2) / 5;
            this.zoomOutCamera.alpha = nextReal() * (Math.PI * 2);
            this.zoomOutCamera.beta = 1.1;
            this.zoomOutCamera.lowerRadiusLimit = 20;
            this.zoomOutCamera.upperRadiusLimit = 100;
            this.zoomOutCamera.radius = 60 + nextReal() * (100 - 60);
            this.scene.activeCamera = this.zoomOutCamera;
            //
            // SHADOW
            //
            // // Ground
            // // options: { width: number, height: number, subdivisions: number, minHeight: number, maxHeight: number, buffer: Uint8Array, bufferWidth: number, bufferHeight: number }): VertexData
            // // let ground = BABYLON.VertexData.CreateGroundFromHeightMap({
            // //
            // // });
            // let ground = BABYLON.Mesh.CreateGroundFromHeightMap('ground', 'textures/heightMap.png', 100, 100, 100, 0, 10, this.scene, false);
            // let groundMaterial = new BABYLON.StandardMaterial('ground', this.scene);
            // let groundTexture = new BABYLON.Texture('textures/ground.jpg', this.scene);
            // groundTexture.uScale = 16;
            // groundTexture.vScale = 16;
            // groundMaterial.diffuseTexture = groundTexture;
            // groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            // ground.position.x = 50;
            // ground.position.z = 50;
            // ground.material = groundMaterial;
            // ground.receiveShadows = true;
            // this.shadowGenerator = new BABYLON.ShadowGenerator(1024, directLight);
            // // render only once
            // this.shadowGenerator.getShadowMap().refreshRate = 0;
            // // this.shadowGenerator.usePoissonSampling = true;
            // this.shadowGenerator.useVarianceShadowMap = true;
            //
            // SCORES
            //
            var scoresTexture = new BABYLON.DynamicTexture('scoresPlaneTex', 512, this.scene, true);
            scoresTexture.hasAlpha = true;
            var scoresMat = new BABYLON.StandardMaterial('scoresPlaneMat', this.scene);
            scoresMat.diffuseTexture = scoresTexture;
            this.scoresPlane = BABYLON.Mesh.CreatePlane('ScoresPlane', 1, this.scene);
            this.scoresPlane.material = scoresMat;
            this.scoresPlane.position.z = 7.5;
            this.scoresPlane.position.y = 2.75;
            this.scoresPlane.parent = this.camera;
            //
            // the fog
            //
            // this.scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
            // this.scene.fogDensity = 30;
            // this.scene.fogColor = new BABYLON.Color3(0.8, 0.83, 0.8);
            this._createEnvironment(playground);
            /*
              PREPARE HIVE COLLISION ANIMATION
             */
            // Create a particle system
            this.hiveCollisionParticleSystem = new BABYLON.ParticleSystem('part1', 250, this.scene);
            this.hiveCollisionParticleSystem.particleTexture = new BABYLON.Texture('textures/bee-particle.png', this.scene);
            this.hiveCollisionParticleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
            this.hiveCollisionParticleSystem.minAngularSpeed = 0;
            this.hiveCollisionParticleSystem.maxAngularSpeed = Math.PI * 2;
            // this.hiveCollisionParticleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
            // this.hiveCollisionParticleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
            // this.hiveCollisionParticleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
            this.hiveCollisionParticleSystem.colorDead = new BABYLON.Color4(1, 1, 0, 0.0);
            this.hiveCollisionParticleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
            this.hiveCollisionParticleSystem.emitter = this.scene;
            this.hiveCollisionParticleSystem.minSize = 0.15;
            this.hiveCollisionParticleSystem.maxSize = .25;
            this.hiveCollisionParticleSystem.minLifeTime = 0.25;
            this.hiveCollisionParticleSystem.maxLifeTime = .5;
            //    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
            this.hiveCollisionParticleSystem.direction1 = new BABYLON.Vector3(-1, 20, 1);
            this.hiveCollisionParticleSystem.direction2 = new BABYLON.Vector3(1, 10, -1);
            // Speed
            this.hiveCollisionParticleSystem.minEmitPower = 1;
            this.hiveCollisionParticleSystem.maxEmitPower = 3;
            this.hiveCollisionParticleSystem.updateSpeed = 0.0075;
            this.hiveCollisionParticleSystem.emitRate = 0;
            this.hiveCollisionParticleSystem.start();
            this.hiveCollisionParticleAnimation = new BABYLON.Animation('part1ani', 'emitRate', 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            this.hiveCollisionParticleAnimation.setKeys([{
                    frame: 0,
                    value: 0
                }, {
                    frame: 4,
                    value: 0
                }, {
                    frame: 5,
                    value: 128
                }, {
                    frame: 15,
                    value: 0
                }, {
                    frame: 30,
                    value: 0
                }]);
            this.hiveCollisionParticleSystem.animations.push(this.hiveCollisionParticleAnimation);
            this.hiveCollisionAnimation = new BABYLON.Animation('part2ani', 'scaling', 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
            this.hiveCollisionAnimation.setKeys([{
                    frame: 0,
                    value: new BABYLON.Vector3(1, 1, 1)
                }, {
                    frame: 5,
                    value: new BABYLON.Vector3(1, 1, 1)
                }, {
                    frame: 30,
                    value: new BABYLON.Vector3(0, 0, 0)
                }]);
        }
        /*
        1 = 1px = devicePixelRatio
        [(1/devicePixelRatio)..4]
        */
        Renderer.prototype.setScreenScale = function (level) {
            this.engine.setHardwareScalingLevel(level);
        };
        Renderer.prototype.switchCameras = function () {
            this.scene.activeCamera = this.scene.activeCamera !== this.camera ? this.camera : this.zoomOutCamera;
        };
        Renderer.prototype.zoomOut = function () {
            this.scene.activeCamera = this.zoomOutCamera;
        };
        Renderer.prototype.zoomIn = function () {
            var _this = this;
            // this.camera.radius = this.zoomOutCamera.radius;
            this.scene.activeCamera = this.camera;
            var i = window.setInterval(function () {
                var readyCount = 0;
                if (_this.camera.rotationOffset < 270) {
                    _this.camera.rotationOffset += 20;
                }
                else {
                    _this.camera.rotationOffset = 270;
                    readyCount = readyCount | 1;
                }
                // TODO: animate radius from zoomOutCam
                // if (this.camera.radius > 5) {
                //   this.camera.radius -= 10;
                // } else {
                //   this.camera.radius = 5;
                //   readyCount = readyCount | 2;
                //   console.log(2, readyCount);
                // }
                if (readyCount >= 1) {
                    window.clearInterval(i);
                }
            }, 32);
        };
        Renderer.prototype._createEnvironment = function (playground) {
            var _this = this;
            var nextReal = window.nextReal;
            var n = playground.map.length;
            var m = playground.map[0].length;
            var skyboxMaterial = new BABYLON.StandardMaterial('skyboxMaterial', this.scene);
            skyboxMaterial.backFaceCulling = false;
            skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture('textures/skybox/skybox', this.scene);
            skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
            skyboxMaterial.disableLighting = true;
            // let skybox = BABYLON.Mesh.CreateBox('skybox', 1024, this.scene);
            // skybox.material = skyboxMat;
            // var skyboxMaterial = new (<any>BABYLON).SkyMaterial('skyMaterial', this.scene);
            // skyboxMaterial.backFaceCulling = false;
            //
            // // skyboxMaterial._cachedDefines.FOG = nextReal() > .5;
            // skyboxMaterial.turbidity = nextReal() * 2; // 0..20 (maybe 100)
            // skyboxMaterial.luminance = .5 + nextReal() * .5; // 0..1..190
            // skyboxMaterial.inclination = .5 + nextReal() * .25; // The solar inclination, related to the solar azimuth in interval [0, 1]
            // skyboxMaterial.azimuth = 0.5 + nextReal() * .05; // The solar azimuth in interval [0, 1]
            // console.log(skyboxMaterial);
            // skyboxMaterial.rayleigh = nextReal() * 2; // Represents the sky appearance (globally) 0..2
            // // Mie scattering (from [Gustav Mie](https://en.wikipedia.org/wiki/Gustav_Mie))
            // Related to the haze particles in atmosphere
            // The amount of haze particles following the Mie scattering theory
            // skyboxMaterial.mieDirectionalG = nextReal(); // 0.8
            // skyboxMaterial.mieCoefficient = nextReal() * .1; // The mieCoefficient in interval [0, 0.1], affects the property skyMaterial.mieDirectionalG
            /*
            case 49: setSkyConfig("material.inclination", skyboxMaterial.inclination, 0); break; // 1
            case 50: setSkyConfig("material.inclination", skyboxMaterial.inclination, -0.5); break; // 2
        
            case 51: setSkyConfig("material.luminance", skyboxMaterial.luminance, 0.1); break; // 3
            case 52: setSkyConfig("material.luminance", skyboxMaterial.luminance, 1.0); break; // 4
        
            case 53: setSkyConfig("material.turbidity", skyboxMaterial.turbidity, 40); break; // 5
            case 54: setSkyConfig("material.turbidity", skyboxMaterial.turbidity, 5); break; // 6
             */
            var skybox = BABYLON.Mesh.CreateBox('skyBox', SKY_SIZE, this.scene, false);
            skybox.material = skyboxMaterial;
            skybox.position.y = SKY_SIZE / 4;
            //
            // ground
            //
            var buffer = PatternHelper.numberMapToUint8Array(playground.heightMap);
            var ground = CustomMesh.createGroundFromHeightMap('ground', buffer, n, m, n, m, Math.round((n + m) / 2), 0, playground.maxHeight, this.scene, false);
            this.surface = ground;
            // let ground = BABYLON.Mesh.CreateGroundFromHeightMap(matName, 'textures/heightMap.png', 100, 100, 100, 0, 10, this.scene, false);
            // polygon.convertToFlatShadedMesh();
            // let intersectionPos = new BABYLON.Vector3(10, 0, 10);
            // let rayPick = new BABYLON.Ray(intersectionPos, new BABYLON.Vector3(0, 1, 0));
            // let pickInfo = ground.intersects(rayPick);
            // console.log(pickInfo);
            // if (pickInfo) {
            //   pickInfo.pickedPoint.y;
            // }
            var groundMaterial = new BABYLON.StandardMaterial('ground', this.scene);
            var groundTexture = new BABYLON.Texture('textures/tile-grass-3.png', this.scene);
            groundTexture.uScale = n;
            groundTexture.vScale = m;
            groundMaterial.diffuseTexture = groundTexture;
            // groundMaterial.diffuseColor = new BABYLON.Color3(.4, .6, .1);
            groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            ground.material = groundMaterial;
            ground.receiveShadows = true;
            ground.position.x = n / 2 - .5;
            ground.position.z = m / 2 - .5;
            // ocean
            // base
            // 355117
            // groundMaterial.diffuseColor = new BABYLON.Color3(.4, .6, .1);
            var baseMaterial = new BABYLON.StandardMaterial('ground', this.scene);
            // let baseTexture = new BABYLON.Texture('textures/ground.jpg', this.scene);
            // baseTexture.uScale = 16;
            // baseTexture.vScale = 16;
            // baseMaterial.diffuseTexture = baseTexture;
            // baseMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            baseMaterial.diffuseColor = new BABYLON.Color3(.4666, .5333, .2);
            baseMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
            var base = BABYLON.Mesh.CreateBox('base', 1, this.scene);
            base.scaling = new BABYLON.Vector3(n, 2, m);
            base.position.x = n / 2 - .5;
            base.position.y = -(1 + .01);
            base.position.z = m / 2 - .5;
            base.material = baseMaterial;
            var base2Mat = new BABYLON.StandardMaterial('base2Mat', this.scene);
            base2Mat.diffuseColor = new BABYLON.Color3(1, .75, .5);
            base2Mat.specularColor = new BABYLON.Color3(0, 0, 0);
            var base2 = BABYLON.Mesh.CreateBox('base2', 1, this.scene);
            base2.scaling = new BABYLON.Vector3(n, 2, m);
            base2.position.x = n / 2 - .5;
            base2.position.y = -(1 + .001) - 2;
            base2.position.z = m / 2 - .5;
            base2.material = base2Mat;
            var base3Mat = new BABYLON.StandardMaterial('base3Mat', this.scene);
            base3Mat.diffuseColor = new BABYLON.Color3(.4666, .5333, .2);
            base3Mat.specularColor = new BABYLON.Color3(0, 0, 0);
            var base3 = BABYLON.Mesh.CreateBox('base3', 1, this.scene);
            base3.scaling = new BABYLON.Vector3(n, 2, m);
            base3.position.x = n / 2 - .5;
            base3.position.y = -(1 + .01) - 4;
            base3.position.z = m / 2 - .5;
            base3.material = base3Mat;
            //
            // add lakes
            //
            var lakeMat = new BABYLON.StandardMaterial('lake', this.scene);
            var lakeTex = new BABYLON.Texture('textures/tile-water-3.png', this.scene);
            lakeMat.diffuseTexture = lakeTex;
            lakeMat.specularColor = new BABYLON.Color3(.25, .25, .25);
            // lakeMat.diffuseColor = new BABYLON.Color3(.1, .25, .5);
            playground.lakes.forEach(function (lake, i) {
                var lakeMesh = CustomMesh.createLake(lake, 'lake' + i, _this.scene);
                lakeMesh.position.y = lake.y;
                lakeMesh.material = lakeMat;
                lakeMesh.alphaIndex = .1;
            });
            //
            // add water
            //
            // let waterMat = new BABYLON.StandardMaterial('waterMat', this.scene);
            // let waterTex = new BABYLON.Texture('textures/tile-water-3.png', this.scene);
            // waterTex.uScale = SKY_SIZE;
            // waterTex.vScale = SKY_SIZE;
            // waterMat.diffuseTexture = waterTex;
            // let water = BABYLON.Mesh.CreatePlane('water', SKY_SIZE, this.scene, false, BABYLON.Mesh.FRONTSIDE);
            // water.material = waterMat;
            // water.rotation.x = Math.PI / 2;
            // water.position.y = -4;
            // Waves Water
            // 	var waterMesh = BABYLON.Mesh.CreateGround('waterMesh', SKY_SIZE, SKY_SIZE, 1, this.scene, false);
            // 	var water = new (<any>BABYLON).WaterMaterial('water', this.scene);
            //   waterMesh.position.y = -1.7;
            //   // waterMesh.position.y = -250;
            // 	water.bumpTexture = new BABYLON.Texture('textures/waterbump.png', this.scene);
            //
            // 	// Water properties
            // 	water.windForce = 1;
            // 	water.waveHeight = .3;
            // 	water.windDirection = new BABYLON.Vector2(1, 1);
            // 	water.waterColor = new BABYLON.Color3(0.1, 0.1, 0.4);
            // 	water.colorBlendFactor = 0;
            // 	water.bumpHeight = 0.1;
            // 	water.waveLength = 1;
            //
            // 	// Add skybox and ground to the reflection and refraction
            // 	water.addToRenderList(skybox);
            // //	water.addToRenderList(ground);
            //
            // 	// Assign the water material
            // 	waterMesh.material = water;
        };
        Renderer.prototype.removeThingView = function (thing) {
            // remove old mesh
            var mesh = this.scene.getMeshByName('' + thing.id);
            if (mesh) {
                this.scene.removeMesh(mesh);
            }
        };
        Renderer.prototype.addThingView = function (thing) {
            var nextReal = window.nextReal;
            var meshName = 'M' + thing.type;
            var matName = 'm' + thing.type;
            var mesh = this.scene.getMeshByName(meshName);
            var mat = this.scene.getMaterialByName(matName);
            var testMat = this.scene.getMaterialByName('testMat');
            if (!testMat) {
                testMat = new BABYLON.StandardMaterial('testMat', this.scene);
                var testTex = new BABYLON.Texture('textures/UVTextureChecker512.png', this.scene);
                testMat.diffuseTexture = testTex;
            }
            switch (thing.type) {
                //
                // TREE
                //
                case ThingType.TREE:
                    if (!mesh) {
                        if (!mat) {
                            var firMat = new BABYLON.StandardMaterial(matName, this.scene);
                            // console.info('+', matName, firMat);
                            // TODO: make specular as autoadjustment option
                            // firMat.specularColor = new BABYLON.Color3(.5, .5, .25);
                            firMat.specularColor = BABYLON.Color3.Black();
                            var firTex = new BABYLON.Texture('textures/tile-tree-3.png', this.scene);
                            firTex.uScale = -1;
                            firTex.vScale = -1;
                            firMat.diffuseTexture = firTex;
                            mat = firMat;
                        }
                        // console.info('+', meshName);
                        mesh = CustomMesh.createTree(meshName, this.scene);
                        mesh.material = mat;
                        mesh.isVisible = false;
                    }
                    mesh = mesh.createInstance('' + thing.id);
                    // this.shadowGenerator.getShadowMap().renderList.push(mesh);
                    // mesh.scaling.multiplyInPlace(new BABYLON.Vector3(.5, .5, .5));
                    mesh.position = thing.position;
                    mesh.rotation = thing.rotation;
                    mesh.scaling = thing.scaling;
                    break;
                //
                // FIR
                //
                case ThingType.FIR:
                    if (!mesh) {
                        if (!mat) {
                            // console.info('+', matName);
                            var firMat = new BABYLON.StandardMaterial(matName, this.scene);
                            // TODO: make specular as autoadjustment option
                            // firMat.specularColor = new BABYLON.Color3(.5, .5, .25);
                            firMat.specularColor = BABYLON.Color3.Black();
                            var firTex = new BABYLON.Texture('textures/tile-fir-0.png', this.scene);
                            firTex.uScale = .2;
                            CustomMesh.normalizePyramidTexture(firTex);
                            firMat.diffuseTexture = firTex;
                            mat = firMat;
                        }
                        // console.info('+', meshName);
                        mesh = CustomMesh.createPyramid(meshName, this.scene);
                        mesh.material = mat;
                        mesh.isVisible = false;
                    }
                    mesh = mesh.createInstance('' + thing.id);
                    // this.shadowGenerator.getShadowMap().renderList.push(mesh);
                    // mesh.scaling.multiplyInPlace(new BABYLON.Vector3(.5, .5, .5));
                    mesh.position = thing.position;
                    mesh.rotation = thing.rotation;
                    mesh.scaling = thing.scaling;
                    break;
                //
                // Mountain
                //
                case ThingType.MOUNTAIN:
                    if (!mesh) {
                        if (!mat) {
                            // console.info('+', matName);
                            var mountainMat = new BABYLON.StandardMaterial(matName, this.scene);
                            // mountainMat.specularColor = new BABYLON.Color3(.5, .5, .25);
                            mountainMat.specularColor = BABYLON.Color3.Black();
                            var mountainTex = new BABYLON.Texture('textures/tile-mountains-0.png', this.scene);
                            CustomMesh.normalizePyramidTexture(mountainTex);
                            mountainMat.diffuseTexture = mountainTex;
                            mat = mountainMat;
                        }
                        // console.info('+', meshName);
                        mesh = CustomMesh.createPyramid(meshName, this.scene);
                        mesh.material = mat;
                        mesh.isVisible = false;
                    }
                    mesh = mesh.createInstance('' + thing.id);
                    // this.shadowGenerator.getShadowMap().renderList.push(mesh);
                    mesh.position = thing.position;
                    mesh.rotation = thing.rotation;
                    mesh.scaling = thing.scaling;
                    break;
                //
                // HIVE
                //
                case ThingType.HIVE:
                    if (!mesh) {
                        if (!mat) {
                            // console.info('+', matName);
                            var hiveMat = new BABYLON.StandardMaterial(matName, this.scene);
                            // mountainMat.specularColor = new BABYLON.Color3(.5, .5, .25);
                            hiveMat.specularColor = BABYLON.Color3.Black();
                            var hiveTex = new BABYLON.Texture('textures/hive.png', this.scene);
                            hiveTex.vScale = -1;
                            hiveTex.uScale = -1;
                            hiveMat.diffuseTexture = hiveTex;
                            mat = hiveMat;
                        }
                        var sphere = BABYLON.Mesh.CreateSphere(meshName, 4, .6, this.scene);
                        // sphere.convertToFlatShadedMesh();
                        sphere.scaling.x = sphere.scaling.z = .75;
                        sphere.position.y = .375 - .25;
                        mesh = BABYLON.Mesh.MergeMeshes([sphere]);
                        mesh.name = meshName;
                        mesh.material = mat;
                        mesh.isVisible = false;
                    }
                    mesh = mesh.createInstance('' + thing.id);
                    mesh.rotation.y = (360 * nextReal()) * (Math.PI / 180);
                    mesh.rotation.x = (nextReal() * 45 - 22.5) * (Math.PI / 180);
                    mesh.rotation.y = (nextReal() * 45 - 22.5) * (Math.PI / 180);
                    mesh.position = thing.position;
                    // ignore thing rotation
                    // mesh.rotation = thing.rotation;
                    mesh.scaling = thing.scaling;
                    // this.shadowGenerator.getShadowMap().renderList.push(mesh);
                    break;
                //
                // BEE
                //
                case ThingType.BEE:
                    if (!mesh) {
                        //
                        // body
                        //
                        var beeBody_1 = BABYLON.Mesh.CreateBox('beeBody', 1, this.scene);
                        beeBody_1.scaling.x = .2;
                        beeBody_1.scaling.y = .2;
                        beeBody_1.scaling.z = .3;
                        beeBody_1.position.x = -.1;
                        beeBody_1.position.y = .75;
                        beeBody_1.rotation.y = Math.PI / 2;
                        var beeBodyMat = new BABYLON.StandardMaterial('beeBodyMat', this.scene);
                        var beeBodyTex = new BABYLON.Texture('textures/bee-body-0.png', this.scene);
                        var rotatedBeeBodyTex = beeBodyTex.clone();
                        rotatedBeeBodyTex.wAng = Math.PI / 2;
                        rotatedBeeBodyTex.vScale = -1;
                        var beeBodyBackTex = new BABYLON.Texture('textures/bee-body-back-0.png', this.scene);
                        beeBodyMat.specularColor = new BABYLON.Color3(0, 0, 0);
                        beeBodyMat.diffuseTexture = beeBodyTex;
                        //Define a material
                        var backMat = new BABYLON.StandardMaterial('beeBodyMat1', this.scene);
                        backMat.diffuseTexture = beeBodyBackTex;
                        var sideMat = new BABYLON.StandardMaterial('beeBodyMat2', this.scene);
                        sideMat.diffuseTexture = beeBodyTex;
                        var topBottomMat = new BABYLON.StandardMaterial('beeBodyMat4', this.scene);
                        topBottomMat.diffuseTexture = rotatedBeeBodyTex;
                        //put into one
                        var multi = new BABYLON.MultiMaterial('beeBodyMatAll', this.scene);
                        multi.subMaterials.push(backMat);
                        multi.subMaterials.push(backMat);
                        multi.subMaterials.push(sideMat);
                        multi.subMaterials.push(sideMat);
                        multi.subMaterials.push(topBottomMat);
                        multi.subMaterials.push(topBottomMat);
                        //apply material
                        beeBody_1.subMeshes = [];
                        var verticesCount = beeBody_1.getTotalVertices();
                        // SubMesh(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: any, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox?: boolean);
                        beeBody_1.subMeshes.push(new BABYLON.SubMesh(0, 0, verticesCount, 0, 6, beeBody_1));
                        beeBody_1.subMeshes.push(new BABYLON.SubMesh(1, 1, verticesCount, 6, 6, beeBody_1));
                        beeBody_1.subMeshes.push(new BABYLON.SubMesh(2, 2, verticesCount, 12, 6, beeBody_1));
                        beeBody_1.subMeshes.push(new BABYLON.SubMesh(3, 3, verticesCount, 18, 6, beeBody_1));
                        beeBody_1.subMeshes.push(new BABYLON.SubMesh(4, 4, verticesCount, 24, 6, beeBody_1));
                        beeBody_1.subMeshes.push(new BABYLON.SubMesh(5, 5, verticesCount, 30, 6, beeBody_1));
                        beeBody_1.material = multi;
                        //
                        // head
                        //
                        var beeHead_1 = BABYLON.Mesh.CreateBox('beeHead', 1, this.scene);
                        beeHead_1.scaling.x = .3;
                        beeHead_1.scaling.y = .3;
                        beeHead_1.scaling.z = .3;
                        beeHead_1.position.x = .2;
                        beeHead_1.position.y = .75;
                        beeHead_1.rotation.y = Math.PI / 2;
                        var beeHeadMat = new BABYLON.StandardMaterial('beeHeadMat', this.scene);
                        // beeHeadMat.diffuseColor = new BABYLON.Color3(.9, .8, 0);
                        beeHead_1.material = beeHeadMat;
                        var beeHeadFrontTex = new BABYLON.Texture('textures/bee-head-front-0.png', this.scene);
                        beeHeadFrontTex.vScale = -1;
                        var beeHeadTopTex = new BABYLON.Texture('textures/bee-head-top-0.png', this.scene);
                        var beeHeadLeftSideTex = new BABYLON.Texture('textures/bee-head-side-0.png', this.scene);
                        var beeHeadRightSideTex = beeHeadLeftSideTex.clone();
                        beeHeadLeftSideTex.wAng = Math.PI;
                        beeHeadRightSideTex.wAng = Math.PI / 2;
                        //Define a material
                        var frontMat = new BABYLON.StandardMaterial('beeHeadMat0', this.scene);
                        frontMat.diffuseTexture = beeHeadFrontTex;
                        topBottomMat = new BABYLON.StandardMaterial('beeHeadMat1', this.scene);
                        topBottomMat.diffuseTexture = beeHeadTopTex;
                        var leftMat = new BABYLON.StandardMaterial('beeHeadMat2', this.scene);
                        leftMat.diffuseTexture = beeHeadLeftSideTex;
                        var rightMat = new BABYLON.StandardMaterial('beeHeadMat3', this.scene);
                        rightMat.diffuseTexture = beeHeadRightSideTex;
                        //put into one
                        multi = new BABYLON.MultiMaterial('beeHeadMatAll', this.scene);
                        multi.subMaterials.push(frontMat);
                        multi.subMaterials.push(topBottomMat);
                        multi.subMaterials.push(leftMat);
                        multi.subMaterials.push(rightMat);
                        multi.subMaterials.push(topBottomMat);
                        multi.subMaterials.push(topBottomMat);
                        //apply material
                        beeHead_1.subMeshes = [];
                        verticesCount = beeHead_1.getTotalVertices();
                        // SubMesh(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: any, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox?: boolean);
                        beeHead_1.subMeshes.push(new BABYLON.SubMesh(0, 0, verticesCount, 0, 6, beeHead_1));
                        beeHead_1.subMeshes.push(new BABYLON.SubMesh(1, 1, verticesCount, 6, 6, beeHead_1));
                        beeHead_1.subMeshes.push(new BABYLON.SubMesh(2, 2, verticesCount, 12, 6, beeHead_1));
                        beeHead_1.subMeshes.push(new BABYLON.SubMesh(3, 3, verticesCount, 18, 6, beeHead_1));
                        beeHead_1.subMeshes.push(new BABYLON.SubMesh(4, 4, verticesCount, 24, 6, beeHead_1));
                        beeHead_1.subMeshes.push(new BABYLON.SubMesh(5, 5, verticesCount, 30, 6, beeHead_1));
                        beeHead_1.material = multi;
                        //
                        // sting
                        //
                        var beeSting_1 = CustomMesh.createPyramid('beeSting', this.scene, false);
                        beeSting_1.scaling.x = .1;
                        beeSting_1.scaling.y = .3;
                        beeSting_1.scaling.z = .1;
                        beeSting_1.position.x = -.25;
                        beeSting_1.position.y = .75;
                        beeSting_1.rotation.z = Math.PI / 2;
                        var beeStingMat = new BABYLON.StandardMaterial('beeStingMat', this.scene);
                        beeStingMat.specularColor = BABYLON.Color3.White();
                        beeStingMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
                        beeSting_1.material = beeStingMat;
                        //
                        // wings
                        //
                        var beeWings_1 = BABYLON.Mesh.CreatePlane('beeWings', 1, this.scene, false, 2);
                        beeWings_1.scaling.x = .2;
                        beeWings_1.scaling.y = .8;
                        // beeWings.scaling.z = .4;
                        beeWings_1.position.x = -.1;
                        beeWings_1.position.y = .75;
                        beeWings_1.rotation.x = Math.PI / 2;
                        var beeWingsMat = new BABYLON.StandardMaterial('beeWingsMat', this.scene);
                        beeWingsMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
                        beeWings_1.material = beeWingsMat;
                        // hide blueprint
                        beeBody_1.isVisible = false;
                        beeHead_1.isVisible = false;
                        beeSting_1.isVisible = false;
                        beeWings_1.isVisible = false;
                    }
                    var beeBody = this.scene.getMeshByName('beeBody').createInstance('beeBody' + thing.id);
                    var beeHead = this.scene.getMeshByName('beeHead').createInstance('beeHead' + thing.id);
                    var beeSting = this.scene.getMeshByName('beeSting').createInstance('beeSting' + thing.id);
                    var beeWings = this.scene.getMeshByName('beeWings').createInstance('beeWings' + thing.id);
                    var meshResizer = BABYLON.Mesh.CreatePlane(meshName + 'Resizer', 0, this.scene, false);
                    meshResizer.isVisible = false;
                    beeBody.parent = meshResizer;
                    beeHead.parent = meshResizer;
                    beeSting.parent = meshResizer;
                    beeWings.parent = meshResizer;
                    meshResizer.scaling.x = meshResizer.scaling.y = meshResizer.scaling.z = .45;
                    mesh = BABYLON.Mesh.CreatePlane(meshName, 0, this.scene, false);
                    mesh.isVisible = false;
                    meshResizer.parent = mesh;
                    mesh.position = thing.position;
                    mesh.rotation = thing.rotation;
                    mesh.scaling = thing.scaling;
                    break;
                //
                // AGENT
                //
                case ThingType.BEAR:
                    if (!mesh) {
                        if (!mat) {
                            mat = new BABYLON.StandardMaterial(matName, this.scene);
                            mat.diffuseColor = BABYLON.Color3.Green();
                            var mountainTex = new BABYLON.Texture('textures/orient.jpg', this.scene);
                            mat.diffuseTexture = mountainTex;
                        }
                        var bearMat = new BABYLON.StandardMaterial('bearMat', this.scene);
                        var bearBodyTex = new BABYLON.Texture('textures/bear-body-0.png', this.scene);
                        bearMat.specularColor = new BABYLON.Color3(0, 0, 0);
                        bearMat.diffuseTexture = bearBodyTex;
                        var head = BABYLON.Mesh.CreateBox('bearHead', .4, this.scene);
                        head.scaling.x = .75;
                        head.scaling.y = .85;
                        head.position.y = .35 + .5;
                        head.position.x = .025;
                        //
                        // head mat
                        //
                        var bearHeadFrontTex = new BABYLON.Texture('textures/bear-face-0.png', this.scene);
                        bearHeadFrontTex.wAng = Math.PI / 2;
                        // bearHeadFrontTex.vScale = -1;
                        /*
                        let beeHeadTopTex = new BABYLON.Texture('textures/bee-head-top-0.png', this.scene);
                        let beeHeadLeftSideTex = new BABYLON.Texture('textures/bee-head-side-0.png', this.scene);
                        let beeHeadRightSideTex = beeHeadLeftSideTex.clone();
                        beeHeadLeftSideTex.wAng = Math.PI;
                        beeHeadRightSideTex.wAng = Math.PI / 2;
                        */
                        //Define a material
                        var frontMat = new BABYLON.StandardMaterial('bearHeadMat0', this.scene);
                        frontMat.diffuseTexture = bearHeadFrontTex;
                        /*
                        topBottomMat = new BABYLON.StandardMaterial('bearHeadMat1', this.scene);
                        topBottomMat.diffuseTexture = beeHeadTopTex;
                        let leftMat = new BABYLON.StandardMaterial('bearHeadMat2', this.scene);
                        leftMat.diffuseTexture = beeHeadLeftSideTex;
                        let rightMat = new BABYLON.StandardMaterial('bearHeadMat3', this.scene);
                        rightMat.diffuseTexture = beeHeadRightSideTex;
                        */
                        //put into one
                        var multi = new BABYLON.MultiMaterial('bearHeadMatAll', this.scene);
                        multi.subMaterials.push(bearMat);
                        multi.subMaterials.push(bearMat);
                        multi.subMaterials.push(frontMat);
                        multi.subMaterials.push(bearMat);
                        multi.subMaterials.push(bearMat);
                        multi.subMaterials.push(bearMat);
                        /*
                        multi.subMaterials.push(topBottomMat);
                        multi.subMaterials.push(leftMat);
                        multi.subMaterials.push(rightMat);
                        multi.subMaterials.push(topBottomMat);
                        multi.subMaterials.push(topBottomMat);
                        */
                        //apply material
                        head.subMeshes = [];
                        var verticesCount = head.getTotalVertices();
                        // SubMesh(materialIndex: number, verticesStart: number, verticesCount: number, indexStart: any, indexCount: number, mesh: AbstractMesh, renderingMesh?: Mesh, createBoundingBox?: boolean);
                        head.subMeshes.push(new BABYLON.SubMesh(0, 0, verticesCount, 0, 6, head));
                        head.subMeshes.push(new BABYLON.SubMesh(1, 1, verticesCount, 6, 6, head));
                        head.subMeshes.push(new BABYLON.SubMesh(2, 2, verticesCount, 12, 6, head));
                        head.subMeshes.push(new BABYLON.SubMesh(3, 3, verticesCount, 18, 6, head));
                        head.subMeshes.push(new BABYLON.SubMesh(4, 4, verticesCount, 24, 6, head));
                        head.subMeshes.push(new BABYLON.SubMesh(5, 5, verticesCount, 30, 6, head));
                        head.material = multi;
                        var lEar = BABYLON.Mesh.CreateCylinder('bearLEar', .025, .15, .15, 8, 1, this.scene, false);
                        lEar.position.z = -.13;
                        lEar.position.y = .55 + .5;
                        lEar.rotation.z = Math.PI / 2;
                        lEar.rotation.x = .4;
                        lEar.material = bearMat;
                        var rEar = BABYLON.Mesh.CreateCylinder('bearREar', .025, .15, .15, 6, 1, this.scene, false);
                        rEar.position.z = .13;
                        rEar.position.y = .55 + .5;
                        rEar.rotation.z = Math.PI / 2;
                        rEar.rotation.x = .4;
                        rEar.material = bearMat;
                        var body = BABYLON.Mesh.CreateBox('bearBody', .6, this.scene);
                        body.scaling.x = .35;
                        body.scaling.z = .5;
                        body.position.y = -.025 + .5;
                        body.material = bearMat;
                        var tail = BABYLON.Mesh.CreateBox('bearTail', .075, this.scene);
                        tail.position.y = -.2 + .5;
                        tail.position.x = -.125;
                        tail.material = bearMat;
                        var lHandPart = BABYLON.Mesh.CreateBox('bearLHandPart', .25, this.scene);
                        lHandPart.scaling.x = lHandPart.scaling.y = .4;
                        lHandPart.position.z = -.15;
                        lHandPart.material = bearMat;
                        var lHand = BABYLON.Mesh.CreatePlane('bearLHand', 1, this.scene);
                        lHand.isVisible = false;
                        lHandPart.parent = lHand;
                        lHand.position.z = -.1;
                        lHand.position.y = .075 + .5;
                        lHand.rotation.x = -Math.PI / 2.75;
                        var rHandPart = BABYLON.Mesh.CreateBox('bearRHandPart', .25, this.scene);
                        rHandPart.scaling.x = rHandPart.scaling.y = .4;
                        rHandPart.position.z = -.15;
                        rHandPart.material = bearMat;
                        var rHand = BABYLON.Mesh.CreatePlane('bearRHand', 1, this.scene);
                        rHand.isVisible = false;
                        rHandPart.parent = rHand;
                        rHand.position.z = .1;
                        rHand.position.y = .075 + .5;
                        rHand.rotation.x = -Math.PI / 2.75;
                        rHand.rotation.y = Math.PI;
                        var lFootPart = BABYLON.Mesh.CreateBox('bearLFootPart', .2, this.scene);
                        lFootPart.scaling.x = lFootPart.scaling.z = .5;
                        lFootPart.position.y = -.1;
                        lFootPart.material = bearMat;
                        var lFoot = BABYLON.Mesh.CreatePlane('bearLFoot', 1, this.scene);
                        lFoot.isVisible = false;
                        lFootPart.parent = lFoot;
                        lFoot.position.z = -.1;
                        lFoot.position.y = -.3 + .5;
                        lFoot.rotation.z = .4;
                        var rFootPart = BABYLON.Mesh.CreateBox('bearRFootPart', .2, this.scene);
                        rFootPart.scaling.x = rFootPart.scaling.z = .5;
                        rFootPart.position.y = -.1;
                        rFootPart.material = bearMat;
                        var rFoot = BABYLON.Mesh.CreatePlane('bearRFoot', 1, this.scene);
                        rFoot.isVisible = false;
                        rFootPart.parent = rFoot;
                        rFoot.position.z = .1;
                        rFoot.position.y = -.3 + .5;
                        rFoot.rotation.z = -.4;
                        mesh = BABYLON.Mesh.CreatePlane(meshName, 0, this.scene, false);
                        mesh.isVisible = false;
                        head.parent = mesh;
                        rEar.parent = mesh;
                        lEar.parent = mesh;
                        body.parent = mesh;
                        rHand.parent = mesh;
                        lHand.parent = mesh;
                        tail.parent = mesh;
                        lFoot.parent = mesh;
                        rFoot.parent = mesh;
                    }
                    else {
                        throw 'only one bear allowed';
                    }
                    // mesh = (<BABYLON.Mesh>mesh).createInstance('' + thing.id);
                    // adjust follow camera
                    this.camera.target = mesh;
                    mesh.position = thing.position;
                    mesh.rotation = thing.rotation;
                    mesh.scaling = thing.scaling;
                    break;
                default:
                    debugger;
            }
            if (!mesh) {
                debugger;
            }
        };
        Renderer.prototype.animateHiveCollision = function (hiveThing) {
            var _this = this;
            var mesh = this.scene.getMeshByID('' + hiveThing.id);
            this.hiveCollisionParticleSystem.emitter = mesh;
            // unbind hive pos from thing
            mesh.position = mesh.position.clone();
            mesh.rotation = mesh.rotation.clone();
            mesh.scaling = mesh.scaling.clone();
            // mesh.isVisible = false;
            var event = new BABYLON.AnimationEvent(30, function () {
                _this.removeThingView(hiveThing);
            }, true);
            // Attach your event to your animation
            this.hiveCollisionParticleAnimation.addEvent(event);
            this.scene.beginAnimation(this.hiveCollisionParticleSystem, 0, 30, false);
            // hive scale animation
            mesh.animations.push(this.hiveCollisionAnimation);
            this.scene.beginAnimation(mesh, 0, 30, false, 2.5);
        };
        Renderer.prototype.destroy = function () {
            throw 'TBD';
        };
        Renderer.prototype.render = function () {
            throw 'TBD';
        };
        return Renderer;
    }());
    return Renderer;
});
