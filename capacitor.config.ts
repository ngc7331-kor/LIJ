import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lifeisjikgwan.app',
  appName: '야구 일정',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
  },
};

export default config;
