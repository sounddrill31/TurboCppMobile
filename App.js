import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, useColorScheme, BackHandler, Platform, Animated, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as ScreenOrientation from 'expo-screen-orientation';

const HOME_URL = 'https://github.com/login';
const HOME_DOMAIN = 'github.com';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_LARGE_DEVICE = SCREEN_WIDTH >= 768 || SCREEN_HEIGHT >= 768; // iPad mini is 768x1024

const BASE_BUTTON_SIZE = IS_LARGE_DEVICE ? 60 : 50;
const BASE_ICON_SIZE = IS_LARGE_DEVICE ? 32 : 28;
const TOGGLE_BUTTON_SIZE = IS_LARGE_DEVICE ? 70 : 60;
const TOGGLE_ICON_SIZE = IS_LARGE_DEVICE ? 38 : 34;

export default function App() {
  const webViewRef = useRef(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(HOME_URL);
  const colorScheme = useColorScheme();
  const [isBarVisible, setIsBarVisible] = useState(false);
  const barHeight = useRef(new Animated.Value(BASE_BUTTON_SIZE + 20)).current;
  const toggleButtonBottom = useRef(new Animated.Value(20)).current;
  const [orientation, setOrientation] = useState('PORTRAIT');

  const isDarkMode = colorScheme === 'dark';

  const theme = {
    barBackground: isDarkMode ? '#1E1E1E' : '#F5F5F5',
    buttonBackground: isDarkMode ? '#333333' : '#E0E0E0',
    iconColor: isDarkMode ? '#FFFFFF' : '#000000',
    toggleButtonBackground: isDarkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(245, 245, 245, 0.8)',
  };

  // Safely render Ionicons
  const renderIcon = (iconName, size, color) => {
    const name = iconMap[iconName] || iconName;
    return (
      <Ionicons
        name={name}
        size={size}
        color={color}
      />
    );
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

  const goBack = () => {
    if (webViewRef.current && canGoBack) {
      webViewRef.current.goBack();
      return true;
    }
    return false;
  };

  const goHome = () => {
    if (webViewRef.current) {
      setCurrentUrl(HOME_URL);
      webViewRef.current.reload();
    }
  };

  const barAnimation = useRef(new Animated.Value(0)).current;

  const toggleBar = () => {
    const newIsBarVisible = !isBarVisible;
    setIsBarVisible(newIsBarVisible);
    
    Animated.spring(barAnimation, {
      toValue: newIsBarVisible ? 1 : 0,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const subscription = ScreenOrientation.addOrientationChangeListener((event) => {
      setOrientation(event.orientationInfo.orientation);
    });

    return () => {
      ScreenOrientation.removeOrientationChangeListener(subscription);
    };
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        return goBack();
      });

      return () => backHandler.remove();
    }
  }, [canGoBack]);

  const isLandscape = orientation === 'LANDSCAPE_LEFT' || orientation === 'LANDSCAPE_RIGHT';

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    statusBarPlaceholder: {
      height: Constants.statusBarHeight,
    },
    webview: {
      flex: 1,
    },
    bottomBar: {
      flexDirection: isLandscape ? 'column' : 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      borderTopLeftRadius: 25,
      borderTopRightRadius: 25,
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: BASE_BUTTON_SIZE + 20,
      paddingVertical: Platform.OS === 'ios' ? 30 : 10, // Added vertical padding for centering
      paddingBottom: Platform.OS === 'ios' ? 30 : 10, // Adjusted for iOS
      overflow: 'hidden',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    button: {
      width: BASE_BUTTON_SIZE,
      height: BASE_BUTTON_SIZE,
      borderRadius: BASE_BUTTON_SIZE / 2,
      justifyContent: 'center',
      alignItems: 'center',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    toggleButton: {
      position: 'absolute',
      right: 20,
      width: TOGGLE_BUTTON_SIZE,
      height: TOGGLE_BUTTON_SIZE,
      borderRadius: 24, // Modified to have curved corners
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
  });

  const barTranslateY = barAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [BASE_BUTTON_SIZE + 10, 0],
  });

  const barScale = barAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1],
  });

  const toggleButtonTranslateY = barAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(BASE_BUTTON_SIZE + 10)],
  });

  return (
    <View style={styles.container}>
      <View style={styles.statusBarPlaceholder} />
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webview}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
      />
      <Animated.View style={[
        styles.bottomBar,
        { 
          transform: [
            { translateY: barTranslateY },
            { scale: barScale }
          ],
          backgroundColor: theme.barBackground 
        }
      ]}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.buttonBackground }]}
          onPress={goBack}
          disabled={!canGoBack}
        >
          <Ionicons 
            name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
            size={BASE_ICON_SIZE} 
            color={canGoBack ? theme.iconColor : theme.iconColor + '66'} 
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.buttonBackground }]}
          onPress={goHome}
        >
          <Ionicons name="home" size={BASE_ICON_SIZE} color={theme.iconColor} />
        </TouchableOpacity>
      </Animated.View>
      <Animated.View style={[
        styles.toggleButton,
        { 
          transform: [{ translateY: toggleButtonTranslateY }],
          backgroundColor: theme.toggleButtonBackground,
          bottom: 20,
        }
      ]}>
        <TouchableOpacity onPress={toggleBar}>
          <Ionicons 
            name={isBarVisible ? (Platform.OS === 'ios' ? 'chevron-down' : 'arrow-down') : (Platform.OS === 'ios' ? 'chevron-up' : 'arrow-up')} 
            size={TOGGLE_ICON_SIZE} 
            color={theme.iconColor} 
          />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}