import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme, BackHandler, Platform, Dimensions, Keyboard, Text, TextInput } from 'react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Menu, MenuOptions, MenuOption, MenuTrigger, MenuProvider } from 'react-native-popup-menu';
import { FontAwesome } from '@expo/vector-icons';

const HOME_URL = '/turboc/index.html';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_LARGE_DEVICE = SCREEN_WIDTH >= 768 || SCREEN_HEIGHT >= 768;

const TOGGLE_BUTTON_SIZE = IS_LARGE_DEVICE ? 70 : 60;
const TOGGLE_ICON_SIZE = IS_LARGE_DEVICE ? 38 : 34;

export default function App() {
  const [tempInput, setTempInput] = useState('');
  const tempInputRef = useRef(null);
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
          // Handle back navigation
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

      // Dispatch event to the document
      const event = new KeyboardEvent('keydown', {
        key: mappedChar.char,
        keyCode: mappedChar.keyCode,
        which: mappedChar.keyCode,
        bubbles: true
      });
      document.dispatchEvent(event);
      document.execCommand("insertText", false, mappedChar.char);
    } else if (text.length < tempInput.length) {
      document.execCommand("delete", false, "");
    }
    setTempInput(text);
  };

  const focusTempInput = () => {
    tempInputRef.current?.focus();
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
    switch (action) {
      case 'home':
        // Navigate to home
        break;
      case 'open':
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "F3", keyCode: 114 }));
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "F3", keyCode: 114 }));
        break;
      case 'save':
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", keyCode: 113 }));
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "F2", keyCode: 113 }));
        break;
      case 'undo':
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Z", keyCode: 90, altKey: true }));
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "Z", keyCode: 90, altKey: true }));
        break;
      case 'redo':
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "Z", keyCode: 90, shiftKey: true, altKey: true }));
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "Z", keyCode: 90, shiftKey: true, altKey: true }));
        break;
      case 'compile':
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "F9", keyCode: 120, altKey: true }));
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "F9", keyCode: 120, altKey: true }));
        break;
      case 'run':
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "F9", keyCode: 120, ctrlKey: true }));
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "F9", keyCode: 120, ctrlKey: true }));
        break;
      case 'output':
        window.dispatchEvent(new KeyboardEvent("keydown", { key: "F5", keyCode: 116, altKey: true }));
        window.dispatchEvent(new KeyboardEvent("keyup", { key: "F5", keyCode: 116, altKey: true }));
        break;
      case 'quit':
        BackHandler.exitApp();
        break;
    }
  };

  const toggleKeyboard = () => {
    if (isKeyboardVisible) {
      Keyboard.dismiss();
    } else {
      tempInputRef.current?.focus();
    }
  };

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

        <View style={styles.content}>
          {/* This is where you'd render your local HTML content */}
          {/* For web, you might use an iframe or directly insert the HTML */}
          {/* For native, you'd need to parse and render the HTML content */}
        </View>

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