#!/bin/bash

# Fetch the submodule contents
git submodule update --init --recursive

# Install dependencies
npm install

# Start the Expo app with tunneling
npx expo start --tunnel