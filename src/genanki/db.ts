export let Database: any;

if (typeof process !== 'undefined' && process.versions && (process.versions as any).bun) {
  // In Bun, we use the built-in bun:sqlite module
  Database = require('bun:sqlite').Database;
} else {
  // In Node.js, we use better-sqlite3
  Database = require('better-sqlite3');
}
