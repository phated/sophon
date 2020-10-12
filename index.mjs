import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import os from 'os';
import fs from 'fs';
import http from 'http';
import level from 'level';
import Primus from 'primus';
import primusEmit from 'primus-emit';
import { createServer } from 'vite';
import inquirer from 'inquirer';
import dotenv from 'dotenv';
import updateDotenv from 'update-dotenv';

import { MIN_CHUNK_SIZE, MAX_CHUNK_SIZE } from './lib/constants.mjs';
import { MinerManager, MinerManagerEvent } from './lib/MinerManager.mjs';
import { SpiralPattern } from './lib/SpiralPattern.mjs';
import LocalStorageManager from './lib/LocalStorageManager.mjs';
import { toBoolean, toNumber, toObject, toFullPath, isUnset, toEnv } from './lib/env-utils.mjs';

let cores = os.cpus();

let env = dotenv.config();

if (env && env.error) {
  if (env.error.code !== 'ENOENT') {
    console.error('Problem loading your `.env` file - please delete it and run again.');
    process.exit(1);
  }

  env = {
    parsed: {}
  };
}

const {
  // Map import/export
  SHOULD_PRELOAD,
  PRELOAD_MAP,
  SHOULD_DUMP,
  // Client & Websocket
  IS_CLIENT_SERVER,
  IS_WEBSOCKET_SERVER,
  PORT,
  // Explorer
  SHOULD_EXPLORE,
  EXPLORE_CORES,
  WORLD_RADIUS,
  RADIUS_UPDATES,
  INIT_COORDS,
  CHUNK_SIZE,
  PERLIN_THRESHOLD,
} = env.parsed;

const answers = await inquirer.prompt([
  // Map import/export
  {
    type: 'confirm',
    name: 'shouldPreload',
    message: 'Would you like to pre-seed Sophon with a map?',
    default: false,
    when: () => isUnset(SHOULD_PRELOAD),
  },
  {
    type: 'input',
    name: 'preloadMap',
    message: `What's the path of your map?`,
    default: isUnset(PRELOAD_MAP) ? null : path.resolve(process.cwd(), PRELOAD_MAP),
    when: ({ shouldPreload }) => {
      return (shouldPreload || toBoolean(SHOULD_PRELOAD))
        && isUnset(PRELOAD_MAP)
    },
    filter: (mapPath) => toFullPath(mapPath),
  },
  {
    type: 'confirm',
    name: 'shouldDump',
    message: `Do you want to dump the current map?`,
    default: true,
    when: () => isUnset(SHOULD_DUMP),
  },
  // Client & Websocket
  {
    type: 'confirm',
    name: 'isClientServer',
    message: `Do you want to serve the custom game client?`,
    default: true,
    when: () => isUnset(IS_CLIENT_SERVER),
  },
  {
    type: 'confirm',
    name: 'isWebsocketServer',
    message: `Do you want to open a websocket channel to this explorer?`,
    default: true,
    when: () => isUnset(IS_WEBSOCKET_SERVER),
  },
  {
    type: 'number',
    name: 'port',
    message: `What port should we start the server on?`,
    default: 8082,
    when: ({ isClientServer, isWebsocketServer }) => {
      return (
        isClientServer
        || toBoolean(IS_CLIENT_SERVER)
        || isWebsocketServer
        || toBoolean(IS_WEBSOCKET_SERVER)
      ) && isUnset(PORT);
    },
  },
  // Explorer
  {
    type: 'confirm',
    name: 'shouldExplore',
    message: `Do you want to explore the universe?`,
    default: true,
    when: () => isUnset(SHOULD_EXPLORE),
  },
  {
    type: 'list',
    name: 'exploreCores',
    message: `How many cores do you want to use?`,
    default: cores.length / 2,
    choices: cores.map((_core, idx) => idx + 1),
    when: ({ shouldExplore }) => {
      return (shouldExplore || toBoolean(SHOULD_EXPLORE)) && isUnset(EXPLORE_CORES);
    },
  },
  {
    type: 'number',
    name: 'worldRadius',
    message: `What's your current world radius?`,
    default: 40500,
    when: ({ shouldExplore }) => {
      return (shouldExplore || toBoolean(SHOULD_EXPLORE)) && isUnset(WORLD_RADIUS);
    },
  },
  {
    type: 'confirm',
    name: 'radiusUpdates',
    message: `Would you like the explorer to listen for world radius updates?`,
    default: true,
    when: ({ shouldExplore, isWebsocketServer }) => {
      return (shouldExplore || toBoolean(SHOULD_EXPLORE))
        && (isWebsocketServer || toBoolean(IS_WEBSOCKET_SERVER))
        && isUnset(RADIUS_UPDATES);
    }
  },
  {
    type: 'input',
    name: 'initCoords',
    message: `Which x,y coords do you want to start mining at? (comma-separated)`,
    default: '0,0',
    when: ({ shouldExplore }) => {
      return (shouldExplore || toBoolean(SHOULD_EXPLORE)) && isUnset(INIT_COORDS);
    },
    filter: (coords) => {
      const [x = 0, y = 0] = coords.split(',').map((i) => i.trim());
      return { x, y };
    },
    transformer: (coords) => {
      if (typeof coords === 'object') {
        return `${coords.x},${coords.y}`;
      }
      return coords;
    },
  },
  {
    type: 'list',
    name: 'chunkSize',
    message: `What size chunks do you want to explore? (bigger takes longer per chunk)`,
    default: MAX_CHUNK_SIZE,
    choices: [
      MIN_CHUNK_SIZE, // 16
      32,
      64,
      128,
      MAX_CHUNK_SIZE, // 256
    ],
    when: ({ shouldExplore }) => {
      return (shouldExplore || toBoolean(SHOULD_EXPLORE)) && isUnset(CHUNK_SIZE);
    },
  },
  {
    type: 'list',
    name: 'perlinThreshold',
    message: `What type of space would you like to explore?`,
    default: 0,
    choices: [
      { name: 'All (Nebula/Space/Deep Space)', value: 0 },
      { name: 'Space & Deep Space', value: 15 },
      { name: 'Just Deep Space', value: 17 }
    ],
    when: ({ shouldExplore }) => {
      return (shouldExplore || toBoolean(SHOULD_EXPLORE)) && isUnset(PERLIN_THRESHOLD);
    },
  },
]);

const {
  // Map import/export
  shouldPreload = toBoolean(SHOULD_PRELOAD),
  preloadMap = toFullPath(PRELOAD_MAP),
  shouldDump = toBoolean(SHOULD_DUMP),
  // Client & Websocket
  isClientServer = toBoolean(IS_CLIENT_SERVER),
  isWebsocketServer = toBoolean(IS_WEBSOCKET_SERVER),
  port = toNumber(PORT),
  // Explorer
  shouldExplore = toBoolean(SHOULD_EXPLORE),
  exploreCores = toNumber(EXPLORE_CORES),
  worldRadius = toNumber(WORLD_RADIUS),
  radiusUpdates = toBoolean(RADIUS_UPDATES),
  initCoords = toObject(INIT_COORDS),
  chunkSize = toNumber(CHUNK_SIZE),
  perlinThreshold = toNumber(PERLIN_THRESHOLD),
} = answers;

await updateDotenv({
  // Map import/export
  SHOULD_PRELOAD: toEnv(shouldPreload),
  PRELOAD_MAP: toEnv(preloadMap),
  SHOULD_DUMP: toEnv(shouldDump),
  // Client & Websocket
  IS_CLIENT_SERVER: toEnv(isClientServer),
  IS_WEBSOCKET_SERVER: toEnv(isWebsocketServer),
  PORT: toEnv(port),
  // Explorer
  SHOULD_EXPLORE: toEnv(shouldExplore),
  EXPLORE_CORES: toEnv(exploreCores),
  WORLD_RADIUS: toEnv(worldRadius),
  RADIUS_UPDATES: toEnv(radiusUpdates),
  INIT_COORDS: toEnv(initCoords),
  CHUNK_SIZE: toEnv(chunkSize),
  PERLIN_THRESHOLD: toEnv(perlinThreshold),
});
console.log('Config written to `.env` file - edit/delete this file to change settings');

const db = level(path.join(__dirname, `known_board_perlin`), { valueEncoding: 'json' });

const planetRarity = 16384;

const initPattern = new SpiralPattern(initCoords, chunkSize);

const localStorageManager = await LocalStorageManager.create(db);

if (shouldPreload && preloadMap) {
  try {
    const chunks = JSON.parse(fs.readFileSync(preloadMap, 'utf8'));

    chunks.forEach((chunk) => localStorageManager.updateChunk(chunk, false));
    console.log(`Successfully loaded map from ${preloadMap}`);
  } catch (err) {
    console.error(`Error importing map from ${preloadMap}`);
    process.exit(1);
  }
}

if (shouldDump) {
  const now = new Date();
  const mapPath = path.resolve(process.cwd(), `./map-export-${now.toISOString()}.json`);
  const chunks = Array.from(localStorageManager.allChunks());
  fs.writeFileSync(mapPath, JSON.stringify(chunks), 'utf8');
  console.log(`Map exported to ${mapPath}`);
}

// Set the env that Rust needs for cores
process.env.RAYON_NUM_THREADS = exploreCores;
const minerManager = MinerManager.create(
  localStorageManager,
  initPattern,
  worldRadius,
  planetRarity,
  perlinThreshold,
);

let server;

import VitePluginReact from 'vite-plugin-react';

if (isClientServer) {
  server = createServer({
    root: path.join(__dirname, 'client'),
    alias: {
      'react': '@pika/react',
      'react-dom': '@pika/react-dom',
      'auto-bind': 'auto-bind/index',
      'crypto': 'crypto-browserify',
      'http': 'http-browserify',
      'https': 'https-browserify',
      'stream': 'stream-browserify',
    },
    jsx: 'react',
    optimizeDeps: {
      include: ['auto-bind/index', 'stylis-rule-sheet'],
    },
    env: {
      PORT: port,
    },
    // Explictly don't add the plugin resolvers because
    // we want prod React to make warnings go away
    // resolvers: [...VitePluginReact.resolvers],
    configureServer: [VitePluginReact.configureServer],
    transforms: [...VitePluginReact.transforms],
  });
} else if (isWebsocketServer) {
  server = http.createServer();
}

let primus;
if (isWebsocketServer) {
  primus = new Primus(server, {
    iknowhttpsisbetter: true,
    plugin: {
      emit: primusEmit,
    }
  });

  primus.on('connection', (spark) => {
    spark.on('set-pattern', (worldCoords) => {
      const newPattern = new SpiralPattern(worldCoords, chunkSize);
      minerManager.setMiningPattern(newPattern);
      const coords = `${worldCoords.x},${worldCoords.y}`;
      updateDotenv({ INIT_COORDS: `${JSON.stringify(worldCoords)}` })
        .then(() => console.log(`Updated INIT_COORDS to ${coords} in .env`))
        .catch(() => console.log(`Failed to update INIT_COORDS to ${coords} in .env`));
    });

    spark.on('set-radius', (radius) => {
      if (!radiusUpdates) {
        return;
      }

      minerManager.setRadius(radius);
      updateDotenv({ WORLD_RADIUS: `${radius}` })
        .then(() => console.log(`Updated WORLD_RADIUS to ${radius} in .env`))
        .catch(() => console.log(`Failed to update WORLD_RADIUS to ${radius} in .env`));
    });

    spark.on('startup-sync', () => {
      // Only send sync chunks with 200 objects in them
      let chunks = [];
      for (let chunk of localStorageManager.allChunks()) {
        if (chunks.length < 200) {
          chunks.push(chunk);
        } else {
          spark.emit('sync-chunks', chunks);
          chunks = [];
        }
      }
      chunks = null;
    });
  });
}

if (server && port) {
  server.listen(port);
}

minerManager.on(MinerManagerEvent.DiscoveredNewChunk, (chunk, miningTimeMillis) => {
  const hashRate = chunk.chunkFootprint.sideLength ** 2 / (miningTimeMillis / 1000);
  if (isWebsocketServer) {
    primus.forEach((spark) => {
      spark.emit('new-chunk', chunk);
      spark.emit('hash-rate', hashRate);
    });
  }
  localStorageManager.updateChunk(chunk, false);
});

if (shouldExplore) {
  minerManager.startExplore();
}
