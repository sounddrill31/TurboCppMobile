import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme, BackHandler, Platform, Dimensions, Keyboard, Text, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import { FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu';

const HOME_URL = 'https://sounddrill31.github.io/TurboCPP-Web';
const HOME_DOMAIN = 'sounddrill31.github.io';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_LARGE_DEVICE = SCREEN_WIDTH >= 768 || SCREEN_HEIGHT >= 768;

const TOGGLE_BUTTON_SIZE = IS_LARGE_DEVICE ? 70 : 60;
const TOGGLE_ICON_SIZE = IS_LARGE_DEVICE ? 38 : 34;

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(HOME_URL);
  const colorScheme = useColorScheme();
  const [orientation, setOrientation] = useState('PORTRAIT');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const isDarkMode = colorScheme === 'dark';

  const theme = {
    background: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    menuBackground: isDarkMode ? '#333333' : '#E0E0E0',
    toggleButtonBackground: isDarkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(245, 245, 245, 0.8)',
  };

  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
    setCurrentUrl(navState.url);
  };

  const getDomainFromUrl = (url) => {
    const matches = url.match(/^https?:\/\/([^/?#]+)(?:[/?#]|$)/i);
    return matches && matches[1];
  };

  const handleShouldStartLoadWithRequest = useCallback((event) => {
    const domain = getDomainFromUrl(event.url);
    if (domain && domain.toLowerCase() !== HOME_DOMAIN) {
      Linking.openURL(event.url);
      return false;
    }
    return true;
  }, []);

  useEffect(() => {
    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      setOrientation(event.orientationInfo.orientation);
    });

    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (canGoBack) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      });

      return () => backHandler.remove();
    }
  }, [canGoBack]);

  const isLandscape = orientation === 'LANDSCAPE_LEFT' || orientation === 'LANDSCAPE_RIGHT';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    statusBarPlaceholder: {
      height: Constants.statusBarHeight,
    },
    webview: {
      flex: 1,
    },
    menuContainer: {
      position: 'absolute',
      top: Constants.statusBarHeight + 10,
      right: 10,
      zIndex: 1000,
    },
    menuTrigger: {
      padding: 10,
    },
    menuOptions: {
      backgroundColor: theme.menuBackground,
    },
    menuOption: {
      padding: 10,
    },
    menuOptionText: {
      color: theme.text,
    },
    toggleButton: {
      position: 'absolute',
      right: 20,
      bottom: 20,
      width: TOGGLE_BUTTON_SIZE,
      height: TOGGLE_BUTTON_SIZE,
      borderRadius: TOGGLE_BUTTON_SIZE / 2,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.toggleButtonBackground,
      zIndex: 1000,
    },
    hiddenInput: {
      position: 'absolute',
      height: 0,
      width: 0,
    },
  });

  const injectJavaScript = (code) => {
    webViewRef.current.injectJavaScript(code);
  };

  const handleMenuAction = (action) => {
    switch (action) {
      case 'open':
        injectJavaScript('document.dispatchEvent(new KeyboardEvent("keydown", {key: "F3", keyCode: 114}));');
        break;
      case 'save':
        injectJavaScript('document.dispatchEvent(new KeyboardEvent("keydown", {key: "F2", keyCode: 113}));');
        break;
      case 'quit':
        BackHandler.exitApp();
        break;
      case 'undo':
        injectJavaScript('document.dispatchEvent(new KeyboardEvent("keydown", {key: "Backspace", keyCode: 8, altKey: true}));');
        break;
      case 'redo':
        injectJavaScript('document.dispatchEvent(new KeyboardEvent("keydown", {key: "Backspace", keyCode: 8, altKey: true, shiftKey: true}));');
        break;
      case 'compile':
        injectJavaScript('document.dispatchEvent(new KeyboardEvent("keydown", {key: "F9", keyCode: 120, altKey: true}));');
        break;
      case 'run':
        injectJavaScript('document.dispatchEvent(new KeyboardEvent("keydown", {key: "F9", keyCode: 120, ctrlKey: true}));');
        break;
      case 'output':
        injectJavaScript('document.dispatchEvent(new KeyboardEvent("keydown", {key: "F5", keyCode: 116, altKey: true}));');
        break;
      case 'zoomIn':
        injectJavaScript('document.body.style.zoom = (parseFloat(document.body.style.zoom) || 1) * 1.1;');
        break;
      case 'zoomOut':
        injectJavaScript('document.body.style.zoom = (parseFloat(document.body.style.zoom) || 1) / 1.1;');
        break;
    }
  };

  const toggleKeyboard = () => {
    if (isKeyboardVisible) {
      Keyboard.dismiss();
    } else {
      inputRef.current.focus();
    }
  };

  const inputRef = useRef(null);

  return (
    <MenuProvider>
      <View style={styles.container}>
        <View style={styles.statusBarPlaceholder} />
        <View style={styles.menuContainer}>
          <Menu>
            <MenuTrigger style={styles.menuTrigger}>
              <FontAwesome name="bars" size={24} color={theme.text} />
            </MenuTrigger>
            <MenuOptions style={styles.menuOptions}>
              <MenuOption onSelect={() => handleMenuAction('open')} style={styles.menuOption}>
                <Text style={styles.menuOptionText}>Open (F3)</Text>
              </MenuOption>
              <MenuOption onSelect={() => handleMenuAction('save')} style={styles.menuOption}>
                <Text style={styles.menuOptionText}>Save (F2)</Text>
              </MenuOption>
              <MenuOption onSelect={() => handleMenuAction('undo')} style={styles.menuOption}>
                <Text style={styles.menuOptionText}>Undo (Alt+Backspace)</Text>
              </MenuOption>
              <MenuOption onSelect={() => handleMenuAction('redo')} style={styles.menuOption}>
                <Text style={styles.menuOptionText}>Redo (Shift+Alt+Backspace)</Text>
              </MenuOption>
              <MenuOption onSelect={() => handleMenuAction('compile')} style={styles.menuOption}>
                <Text style={styles.menuOptionText}>Compile (Alt+F9)</Text>
              </MenuOption>
              <MenuOption onSelect={() => handleMenuAction('run')} style={styles.menuOption}>
                <Text style={styles.menuOptionText}>Run (Ctrl+F9)</Text>
              </MenuOption>
              <MenuOption onSelect={() => handleMenuAction('output')} style={styles.menuOption}>
                <Text style={styles.menuOptionText}>Output (Alt+F5)</Text>
              </MenuOption>
              <MenuOption onSelect={() => handleMenuAction('zoomIn')} style={styles.menuOption}>
                <Text style={styles.menuOptionText}>Zoom In</Text>
              </MenuOption>
              <MenuOption onSelect={() => handleMenuAction('zoomOut')} style={styles.menuOption}>
                <Text style={styles.menuOptionText}>Zoom Out</Text>
              </MenuOption>
              <MenuOption onSelect={() => handleMenuAction('quit')} style={styles.menuOption}>
                <Text style={styles.menuOptionText}>Quit</Text>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webview}
          onNavigationStateChange={handleNavigationStateChange}
          onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        />
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={toggleKeyboard}
        >
          <FontAwesome 
            name="keyboard-o" 
            size={TOGGLE_ICON_SIZE} 
            color={theme.text} 
          />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          onBlur={() => setKeyboardVisible(false)}
        />
      </View>
    </MenuProvider>
  );
}