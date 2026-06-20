export interface DeviceProfileData {
  platform: string;
  version: string;
  model: string;
  vendor: string;
  resolution: string;
  features: {
    drm: boolean;
    hbbtv: boolean;
    tizen: boolean;
    webos: boolean;
  };
}

export interface Session {
  sessionId: string;
  createdTime: string;
  deviceProfile: DeviceProfileData;
  events: any[];
  errors: any[];
}

export class InMemoryStore {
  private sessions: Map<string, Session> = new Map();
  private totalEventsCount: number = 0;
  private totalErrorsCount: number = 0;

  createSession(sessionId: string, deviceProfile: DeviceProfileData): Session {
    const session: Session = {
      sessionId,
      createdTime: new Date().toISOString(),
      deviceProfile,
      events: [],
      errors: []
    };
    this.sessions.set(sessionId, session);
    return session;
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  getAllSessions(): Session[] {
    return Array.from(this.sessions.values());
  }

  addEvents(sessionId: string, events: any[]): boolean {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = this.createSession(sessionId, {
        platform: 'Auto-Created',
        version: 'unknown',
        model: 'unknown',
        vendor: 'unknown',
        resolution: 'unknown',
        features: { drm: false, hbbtv: false, tizen: false, webos: false }
      });
    }
    session.events.push(...events);
    this.totalEventsCount += events.length;
    return true;
  }

  addError(sessionId: string, errorPayload: any): boolean {
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = this.createSession(sessionId, {
        platform: 'Auto-Created',
        version: 'unknown',
        model: 'unknown',
        vendor: 'unknown',
        resolution: 'unknown',
        features: { drm: false, hbbtv: false, tizen: false, webos: false }
      });
    }
    session.errors.push(errorPayload);
    this.totalErrorsCount++;
    return true;
  }

  getMetrics() {
    return {
      totalSessions: this.sessions.size,
      totalEventsTracked: this.totalEventsCount,
      totalErrors: this.totalErrorsCount
    };
  }

  clear() {
    this.sessions.clear();
    this.totalEventsCount = 0;
    this.totalErrorsCount = 0;
  }
}

export const store = new InMemoryStore();
