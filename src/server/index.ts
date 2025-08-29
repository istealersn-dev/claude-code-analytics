#!/usr/bin/env node

/**
 * Claude Code Analytics API Server
 * 
 * Entry point for starting the Express server that provides
 * REST API endpoints for the analytics dashboard.
 */

import { startServer } from './app.js';

// Start the server
startServer()
  .then(({ server, config }) => {
    console.log(`✅ Claude Code Analytics API started successfully`);
  })
  .catch((error) => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });