#!/bin/bash
if [ ! -d node_modules ]; then
    yarn
fi
node main.js
