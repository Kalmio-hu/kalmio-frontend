import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'hu.kalmio.app',
  appName: 'Kalmio',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,   // we hide it manually from JS
      launchAutoHide: false,
      backgroundColor: '#1A1A1A',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
}

export default config
