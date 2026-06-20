const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './test',
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true,
    viewport: { width: 1280, height: 720 }
  },
  webServer: [
    {
      command: 'node server.js',
      url: 'http://localhost:8080',
      reuseExistingServer: !process.env.CI,
      timeout: 10000
    },
    {
      command: 'node ../api/dist/index.js',
      url: 'http://localhost:4000/health',
      reuseExistingServer: !process.env.CI,
      timeout: 10000
    }
  ]
});
