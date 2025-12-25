"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomLimit = randomLimit;
function randomLimit(range) {
    const [min, max] = range;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
