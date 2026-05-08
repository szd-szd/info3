import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port affiché dans le navigateur quand Docker mappe l’hôte → conteneur (ex. 5243:5320).
// Sans cela, Vite peut rejeter l’en-tête Host et le HMR WebSocket utilise le mauvais port.
const dockerHmrClientPort = process.env.DOCKER_HMR_CLIENT_PORT
  ? Number(process.env.DOCKER_HMR_CLIENT_PORT)
  : undefined;

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5320,
    strictPort: true,
    // En Docker / tunnel / reverse-proxy, évite les refus de connexion (ex. Chromium -101).
    allowedHosts: true,
    ...(dockerHmrClientPort
      ? {
          hmr: {
            host: 'localhost',
            clientPort: dockerHmrClientPort,
          },
        }
      : {}),
  },
});
