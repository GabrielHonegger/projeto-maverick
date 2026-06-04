import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.agusmotoconceito.app',
  appName: 'Agus Moto Conceito',
  webDir: 'out',
  server: {
    url: 'https://app.agusmotoconceito.com.br',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
