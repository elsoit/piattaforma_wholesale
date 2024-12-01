#!/bin/bash
echo "Deploying Test Environment..."
npm run clean
npm install
npm run build:test
pm2 restart piattaforma-whls-test 