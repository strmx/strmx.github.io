/// <reference path="../typings/interfaces.d.ts"/>
define(["require", "exports", './utils/Randomizer', './map/Playground', './game/GameOptionsGenerator', './game/GameData', './game/GamePlay', './render/Renderer'], function (require, exports, Randomizer, Playground, GameOptionsGenerator, GameData, GamePlay, Renderer) {
    "use strict";
    function generateNewMap() {
        var seed = (Math.round(Math.random() * 1000000000)).toString(36).toUpperCase();
        window.location.hash = seed;
    }
    // PREPARE RANDOMIZER (#)
    var initialHash = window.location.hash.replace(/#/g, '');
    window.onhashchange = function () {
        window.location.reload();
    };
    if (!initialHash) {
        generateNewMap();
    }
    var seed = parseInt(initialHash, 36);
    window.nextReal = Randomizer.generateNextRealFunction(seed);
    var first = document.querySelector('[firstScreen]');
    var newMapButton = first.querySelector('[newMapButton]');
    var playButton = first.querySelector('[playButton]');
    newMapButton.addEventListener('click', function () {
        first.parentNode.removeChild(first);
        generateNewMap();
    });
    playButton.addEventListener('click', function () {
        first.parentNode.removeChild(first);
        gameplay.start(function (scores, isSuccess) {
            alert(isSuccess ? "You Win!\nYour scores: " + scores : "Game Over\nYour scores: " + scores);
            window.location.reload();
        });
    });
    // NEW GAME
    var gameOptions = GameOptionsGenerator.generate();
    // 1. create 2d+ playground
    var playground = new Playground(gameOptions);
    // 2. render environment with surface (ground)
    var renderer = new Renderer(playground);
    // 3. recalculate Y positions (from real surface mesh)
    playground.updateElevationMap(renderer.surface);
    var gameData = new GameData(gameOptions, playground);
    gameData.generateThings();
    var gameplay = new GamePlay(gameData, renderer);
});
