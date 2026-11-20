import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';

import App from './App';

// Global web style reset to fully remove click-time border color, focus ring, and tap highlight
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const styleId = 'expo-remove-click-border-style';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      *, *::before, *::after {
        outline: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      *:focus, *:focus-visible, *:active {
        outline: none !important;
        box-shadow: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      button:focus, input:focus, textarea:focus, select:focus, a:focus, div:focus, [role="button"]:focus, [tabindex]:focus {
        outline: none !important;
        box-shadow: none !important;
      }
    `;
    document.head.appendChild(style);
  }
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
