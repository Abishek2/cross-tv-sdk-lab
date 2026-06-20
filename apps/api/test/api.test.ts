import request from 'supertest';
import assert from 'assert';
import { app, server } from '../src/index';
import { store } from '../src/store';

describe('Backend API Integration Tests', () => {

  beforeEach(() => {
    store.clear();
  });

  after((done) => {
    server.close(() => {
      done();
    });
  });

  describe('GET /health', () => {
    it('should return 200 and healthy status', async () => {
      const res = await request(app).get('/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.ok(res.body.uptime);
    });
  });

  describe('GET /metrics', () => {
    it('should return initial telemetry metrics', async () => {
      const res = await request(app).get('/metrics');
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(res.body, {
        totalSessions: 0,
        totalEventsTracked: 0,
        totalErrors: 0
      });
    });
  });

  describe('GET /config/:profile', () => {
    it('should return config containing profile-specific stream and ad timings', async () => {
      const res = await request(app).get('/config/tizen');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.profile, 'TIZEN');
      assert.ok(res.body.streamUrl);
      assert.ok(Array.isArray(res.body.adBreaks));
    });
  });

  describe('POST /sessions', () => {
    it('should register a new device session', async () => {
      const res = await request(app)
        .post('/sessions')
        .send({
          sessionId: 'test-session-123',
          deviceProfile: {
            platform: 'PC',
            version: '10',
            model: 'Chrome',
            vendor: 'Google',
            resolution: '1920x1080',
            features: { drm: true, hbbtv: false, tizen: false, webos: false }
          }
        });
      assert.strictEqual(res.status, 201);
      assert.deepStrictEqual(res.body, {
        status: 'created',
        sessionId: 'test-session-123'
      });
    });
  });

  describe('POST /telemetry/batch', () => {
    it('should queue telemetry batches and update metrics', async () => {
      // 1. Send telemetry
      const res = await request(app)
        .post('/telemetry/batch')
        .send({
          sessionId: 'test-session-123',
          events: [
            { name: 'app_start', timestamp: new Date().toISOString(), payload: {} },
            { name: 'play_click', timestamp: new Date().toISOString(), payload: {} }
          ]
        });
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(res.body, {
        status: 'received',
        count: 2
      });

      // 2. Verify metrics updated
      const metricsRes = await request(app).get('/metrics');
      assert.strictEqual(metricsRes.body.totalEventsTracked, 2);
    });
  });

  describe('POST /errors', () => {
    it('should record an error log payload', async () => {
      const res = await request(app)
        .post('/errors')
        .send({
          sessionId: 'test-session-123',
          type: 'uncaughtException',
          error: { message: 'ReferenceError: x is not defined', source: 'app.js' },
          timestamp: new Date().toISOString()
        });
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(res.body, { status: 'received' });

      // Check errors in metrics
      const metricsRes = await request(app).get('/metrics');
      assert.strictEqual(metricsRes.body.totalErrors, 1);
    });
  });

  describe('GET /diagnostics/:sessionId', () => {
    it('should query logs by sessionId', async () => {
      // Register session and add data
      store.createSession('session-xyz', {
        platform: 'WebOS', version: '4.0', model: 'LG', vendor: 'LG', resolution: '1920x1080',
        features: { drm: true, hbbtv: false, tizen: false, webos: true }
      });
      store.addEvents('session-xyz', [{ name: 'init' }]);
      store.addError('session-xyz', { message: 'crash' });

      const res = await request(app).get('/diagnostics/session-xyz');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.sessionId, 'session-xyz');
      assert.strictEqual(res.body.events.length, 1);
      assert.strictEqual(res.body.errors.length, 1);
    });

    it('should return all sessions if requested with all', async () => {
      store.createSession('session-1', {
        platform: 'PC', version: '1', model: 'M1', vendor: 'V1', resolution: '1920x1080',
        features: { drm: true, hbbtv: false, tizen: false, webos: false }
      });
      store.createSession('session-2', {
        platform: 'PC', version: '1', model: 'M1', vendor: 'V1', resolution: '1920x1080',
        features: { drm: true, hbbtv: false, tizen: false, webos: false }
      });

      const res = await request(app).get('/diagnostics/all');
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body));
      assert.strictEqual(res.body.length, 2);
    });
  });

});
