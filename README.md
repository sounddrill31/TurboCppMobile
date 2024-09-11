# Turbo C++ Web Client for Mobile - Made with Expo/React Native

## Intro

Turbo C++ Web - Mobile client

Warning: WIP and many keys don't work
## Setup Instructions

### Clone this repo

You can do this using:
```
git clone https://github.com/sounddrill31/TurboCppMobile TurboCppMobile
```

Now, enter the directory using `cd TurboCppMobile`
### Set up nvm 

You can do this by following [these](https://github.com/nvm-sh/nvm#installing-and-updating) instructions


### Use recent node using nvm
```
nvm use node
```
### Install Deps

```
npx expo install react-native-webview @expo/vector-icons expo-constants expo-linking expo-screen-orientation react-native-popup-menu expo-system-ui
```

### Run App
npx expo start --tunnel

Use the app to connect to it

## Troubleshooting
If you get errors like:

Error: Cannot find module 'metro/src/lib/TerminalReporter'

Try to fix expo using a command like:
```
npx expo install --fix
```