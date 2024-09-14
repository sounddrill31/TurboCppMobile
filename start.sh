#!/bin/bash

# Fetch the submodule contents
git submodule init
git submodule update --init --recursive
git submodule foreach --recursive git checkout offline-mobile-html

# Install dependencies
npm install

# Start the Expo app with tunneling
npx expo start --tunnel