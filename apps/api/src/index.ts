import express, { Request, Response } from 'express';
import cors from 'cors';
import { store } from './store';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// GET /health
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// GET /metrics
app.get('/metrics', (req: Request, res: Response) => {
  res.json(store.getMetrics());
});

// GET /ads
app.get('/ads', (req: Request, res: Response) => {
  res.json([
    {
      id: 'pre-roll-1',
      time: 0,
      duration: 10,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    },
    {
      id: 'mid-roll-1',
      time: 30,
      duration: 15,
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
    }
  ]);
});

// GET /config/:profile
app.get('/config/:profile', (req: Request, res: Response) => {
  const profile = req.params.profile.toUpperCase();
  
  let streamUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  if (profile === 'TIZEN') {
    streamUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';
  } else if (profile === 'WEBOS') {
    streamUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4';
  } else if (profile === 'HBBTV') {
    // HbbTV often uses MPEG-DASH or HLS. For simulation, we use this test HLS stream
    streamUrl = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  }

  res.json({
    profile: profile,
    streamUrl: streamUrl,
    telemetryEndpoint: `http://localhost:4000/telemetry/batch`,
    errorEndpoint: `http://localhost:4000/errors`,
    telemetryBatchSize: 3,
    telemetryFlushInterval: 5000,
    retryOptions: {
      maxRetries: 4,
      initialDelay: 1000,
      backoffFactor: 2,
      jitter: true
    },
    adBreaks: [
      {
        id: 'pre-roll-1',
        time: 0,
        duration: 10,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      },
      {
        id: 'mid-roll-1',
        time: 30,
        duration: 15,
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
      }
    ]
  });
});

// POST /sessions
app.post('/sessions', (req: Request, res: Response) => {
  const { sessionId, deviceProfile } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'sessionId is required' });
  }

  const session = store.createSession(sessionId, deviceProfile || {
    platform: 'PC',
    version: 'unknown',
    model: 'unknown',
    vendor: 'unknown',
    resolution: 'unknown',
    features: { drm: false, hbbtv: false, tizen: false, webos: false }
  });

  res.status(201).json({
    status: 'created',
    sessionId: session.sessionId
  });
});

// POST /telemetry/batch
app.post('/telemetry/batch', (req: Request, res: Response) => {
  const { sessionId, events } = req.body;
  if (!sessionId || !Array.isArray(events)) {
    return res.status(400).json({ error: 'sessionId and events array are required' });
  }

  store.addEvents(sessionId, events);
  res.json({
    status: 'received',
    count: events.length
  });
});

// POST /errors
app.post('/errors', (req: Request, res: Response) => {
  const { sessionId, type, error, timestamp } = req.body;
  if (!sessionId || !error) {
    return res.status(400).json({ error: 'sessionId and error object are required' });
  }

  store.addError(sessionId, { type, error, timestamp });
  res.json({ status: 'received' });
});

// GET /diagnostics/:sessionId
app.get('/diagnostics/:sessionId', (req: Request, res: Response) => {
  const sessionId = req.params.sessionId;
  
  if (sessionId === 'all') {
    return res.json(store.getAllSessions());
  }

  const session = store.getSession(sessionId);
  if (!session) {
    return res.status(404).json({ error: `Session ${sessionId} not found` });
  }

  res.json(session);
});

// Expose server instance for supertest testing
const server = app.listen(PORT, () => {
  console.log(`Backend API listening on port ${PORT}`);
});

export { app, server };
