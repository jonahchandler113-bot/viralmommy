#!/usr/bin/env node
/**
 * Start all queue workers
 * Run this script to start processing videos
 *
 * Usage:
 *   npm run workers
 *   or
 *   node --loader tsx lib/queue/start-workers.ts
 */

import './video-worker';
import './ai-worker';

console.log('='.repeat(50));
console.log('ViralMommy Queue Workers Started');
console.log('='.repeat(50));
console.log('Active workers:');
console.log('  - Video Processing Worker (concurrency: 2)');
console.log('  - AI Analysis Worker (concurrency: 1)');
console.log('  - Strategy Generation Worker (concurrency: 3)');
console.log('='.repeat(50));
console.log('Press Ctrl+C to stop all workers');
console.log('='.repeat(50));

// Keep the process running
process.on('SIGINT', () => {
  console.log('\nShutting down workers gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down workers gracefully...');
  process.exit(0);
});
