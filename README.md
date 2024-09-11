# Web Wrapper - Made with Expo/React Native

## Intro
Simple web wrapper to convert your mobile-friendly website into a mobile app with Android Support(Maybe even iOS, not tested)

Change URL and Domain in App.js to your site's login/home page

## Setup Instructions

### Clone this repo

You can do this using:
```
git clone https://github.com/sounddrill31/web-wrapper-template-expo wrapper
```

Now, enter the directory using `cd wrapper`
### Set up nvm 

You can do this by following [these](https://github.com/nvm-sh/nvm#installing-and-updating) instructions


### Use recent node using nvm
```
nvm use node
```
### Install Deps

```
npx expo install react-native-webview @expo/vector-icons expo-constants expo-linking expo-screen-orientation
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