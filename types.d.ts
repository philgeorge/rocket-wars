// Global type declarations for Phaser.js
// This file helps VS Code understand Phaser types when using the CDN version

/// <reference types="phaser" />

// Make Phaser available globally
declare global {
  const Phaser: typeof import('phaser');
}

// Export empty object to make this a module
export {};
