#!/bin/bash
echo "Deploying Production Environment..."
npm run clean
npm install
npm run build:prod
pm2 restart piattaforma-whls-prod 