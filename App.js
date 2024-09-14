import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme, BackHandler, Platform, Dimensions, Keyboard, Text, TextInput } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu';
import { FontAwesome } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_LARGE_DEVICE = SCREEN_WIDTH >= 768 || SCREEN_HEIGHT >= 768;

const TOGGLE_BUTTON_SIZE = IS_LARGE_DEVICE ? 70 : 60;
const TOGGLE_ICON_SIZE = IS_LARGE_DEVICE ? 38 : 34;

export default function App() {
  const [tempInput, setTempInput] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const tempInputRef = useRef(null);
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const colorScheme = useColorScheme();
  const [orientation, setOrientation] = useState('PORTRAIT');
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [baseUrl, setBaseUrl] = useState(null);

  const isDarkMode = colorScheme === 'dark';

  const theme = {
    background: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    menuBackground: isDarkMode ? '#333333' : '#E0E0E0',
    toggleButtonBackground: isDarkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(245, 245, 245, 0.8)',
  };

  useEffect(() => {
    const loadTurboCFiles = async () => {
      try {
        const turboCDir = FileSystem.documentDirectory + 'turboc/';
        await FileSystem.makeDirectoryAsync(turboCDir, { intermediates: true });

        const assetFiles = [
          require('./turboc/index.html'),
          require('./turboc/jsdos/js-dos.js'),
          require('./turboc/jsdos/js-dos.css'),
          // Add all other files in the turboc directory here
        ];

        for (const asset of assetFiles) {
          if (asset) {
            const { uri } = Asset.fromModule(asset);
            const fileName = uri.split('/').pop();
            const destinationUri = `${turboCDir}${fileName}`;
            await FileSystem.downloadAsync(uri, destinationUri);
          }
        }

        setBaseUrl(FileSystem.documentDirectory + 'turboc/');
        const indexHtmlPath = `${turboCDir}index.html`;
        const indexHtmlContent = await FileSystem.readAsStringAsync(indexHtmlPath);
        setHtmlContent(indexHtmlContent);
      } catch (error) {
        console.error('Failed to load TurboC files:', error);
      }
    };

    loadTurboCFiles();
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
          webViewRef.current?.goBack();
          return true;
        }
        return false;
      });

      return () => backHandler.remove();
    }
  }, [canGoBack]);

  const keyboardMap = {
    "~": { char: '"', keyCode: 222 },
    '`': { char: "'", keyCode: 222 },
  };

  const handleTempInputChange = (text) => {
    if (text.length > tempInput.length) {
      const newChar = text.slice(-1);
      const mappedChar = keyboardMap[newChar] || { char: newChar, keyCode: newChar.charCodeAt(0) };

      const jsCode = `
        (function() {
          var event = new KeyboardEvent('keydown', {
            key: '${mappedChar.char}',
            keyCode: ${mappedChar.keyCode},
            which: ${mappedChar.keyCode},
            bubbles: true
          });
          window.dispatchEvent(event);
          var activeElement = window.document.activeElement;
          if (activeElement && activeElement.isContentEditable) {
            activeElement.textContent += '${mappedChar.char}';
          } else if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            var start = activeElement.selectionStart;
            var end = activeElement.selectionEnd;
            activeElement.value = activeElement.value.substring(0, start) + '${mappedChar.char}' + activeElement.value.substring(end);
            activeElement.selectionStart = activeElement.selectionEnd = start + 1;
          }
        })();
      `;
      webViewRef.current?.injectJavaScript(jsCode);
    } else if (text.length < tempInput.length) {
      const jsCode = `
        (function() {
          var activeElement = window.document.activeElement;
          if (activeElement && activeElement.isContentEditable) {
            activeElement.textContent = activeElement.textContent.slice(0, -1);
          } else if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
            var start = activeElement.selectionStart;
            var end = activeElement.selectionEnd;
            if (start === end) {
              activeElement.value = activeElement.value.substring(0, start - 1) + activeElement.value.substring(end);
              activeElement.selectionStart = activeElement.selectionEnd = start - 1;
            } else {
              activeElement.value = activeElement.value.substring(0, start) + activeElement.value.substring(end);
              activeElement.selectionStart = activeElement.selectionEnd = start;
            }
          }
        })();
      `;
      webViewRef.current?.injectJavaScript(jsCode);
    }
    setTempInput(text);
  };


  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    statusBarPlaceholder: {
      height: Constants.statusBarHeight,
    },
    content: {
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
    tempInput: {
      position: 'absolute',
      opacity: 0,
      height: 1,
      width: '100%',
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
  });

  const handleMenuAction = (action) => {
    const jsCode = {
      home: `window.location.href = 'about:blank';`,
      open: `(function() { var event = new KeyboardEvent('keydown', { key: 'F3', keyCode: 114 }); window.dispatchEvent(event); })();`,
      save: `(function() { var event = new KeyboardEvent('keydown', { key: 'F2', keyCode: 113 }); window.dispatchEvent(event); })();`,
      undo: `(function() { var event = new KeyboardEvent('keydown', { key: 'Z', keyCode: 90, altKey: true }); window.dispatchEvent(event); })();`,
      redo: `(function() { var event = new KeyboardEvent('keydown', { key: 'Z', keyCode: 90, shiftKey: true, altKey: true }); window.dispatchEvent(event); })();`,
      compile: `(function() { var event = new KeyboardEvent('keydown', { key: 'F9', keyCode: 120, altKey: true }); window.dispatchEvent(event); })();`,
      run: `(function() { var event = new KeyboardEvent('keydown', { key: 'F9', keyCode: 120, ctrlKey: true }); window.dispatchEvent(event); })();`,
      output: `(function() { var event = new KeyboardEvent('keydown', { key: 'F5', keyCode: 116, altKey: true }); window.dispatchEvent(event); })();`,
    };

    if (action === 'quit') {
      BackHandler.exitApp();
    } else if (jsCode[action]) {
      webViewRef.current?.injectJavaScript(jsCode[action]);
    }
  };

  const toggleKeyboard = () => {
    if (isKeyboardVisible) {
      Keyboard.dismiss();
    } else {
      tempInputRef.current?.focus();
    }
  };

  const Content = () => (
    <WebView
      ref={webViewRef}
      source={{ html: htmlContent, baseUrl: baseUrl }}
      style={styles.content}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      allowFileAccess={true}
      allowUniversalAccessFromFileURLs={true}
      onNavigationStateChange={(navState) => {
        setCanGoBack(navState.canGoBack);
      }}
      onMessage={(event) => {
        // Handle any messages from the WebView here
        console.log('Message from WebView:', event.nativeEvent.data);
      }}
    />
  );

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
              <MenuOption onSelect={() => handleMenuAction('home')} style={styles.menuOption}>
                <Text style={styles.menuOptionText}>Home</Text>
              </MenuOption>
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
              <MenuOption onSelect={() => handleMenuAction('quit')} style={styles.menuOption}>
                <Text style={styles.menuOptionText}>Quit</Text>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>

        <Content />

        <TextInput
          ref={tempInputRef}
          style={styles.tempInput}
          value={tempInput}
          onChangeText={handleTempInputChange}
          autoCorrect={false}
          autoCapitalize="none"
          autoCompleteType="off"
          textContentType="none"
          keyboardType="visible-password"
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
      </View>
    </MenuProvider>
  );
}