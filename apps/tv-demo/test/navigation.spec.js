const { test, expect } = require('@playwright/test');

test.describe('TV Navigation E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Log browser console output
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });
    // Log unhandled page exceptions
    page.on('pageerror', err => {
      console.log(`[BROWSER UNHANDLED ERROR] ${err.stack}`);
    });

    // Navigate to TV Demo landing page
    await page.goto('/');
  });

  test('should load the page and focus the first menu item by default', async ({ page }) => {
    // Check main menu buttons
    const playBtn = page.locator('#menu-btn-play');
    await expect(playBtn).toHaveClass(/focused/);

    const title = page.locator('.brand-text');
    await expect(title).toContainText('CROSS-TV');
  });

  test('should navigate vertically using ArrowDown and ArrowUp keys', async ({ page }) => {
    const playBtn = page.locator('#menu-btn-play');
    const diagBtn = page.locator('#menu-btn-diagnostics');
    const profileBtn = page.locator('#menu-btn-profile');

    // Focus starts on playBtn
    await expect(playBtn).toHaveClass(/focused/);

    // Arrow down moves focus to Diagnostics button
    await page.keyboard.press('ArrowDown');
    await expect(playBtn).not.toHaveClass(/focused/);
    await expect(diagBtn).toHaveClass(/focused/);

    // Arrow down again moves focus to Device Profile button
    await page.keyboard.press('ArrowDown');
    await expect(diagBtn).not.toHaveClass(/focused/);
    await expect(profileBtn).toHaveClass(/focused/);

    // Arrow up moves focus back to Diagnostics button
    await page.keyboard.press('ArrowUp');
    await expect(diagBtn).toHaveClass(/focused/);
  });

  test('should enter and leave diagnostics screen', async ({ page }) => {
    const diagBtn = page.locator('#menu-btn-diagnostics');
    const diagScreen = page.locator('#screen-diagnostics');
    const dashboardScreen = page.locator('#screen-dashboard');

    // 1. Move focus to diagnostics and hit Enter
    await page.keyboard.press('ArrowDown');
    await expect(diagBtn).toHaveClass(/focused/);
    await page.keyboard.press('Enter');

    // 2. Diagnostics screen should be active, dashboard hidden
    await expect(diagScreen).toHaveClass(/active/);
    await expect(dashboardScreen).not.toHaveClass(/active/);

    // 3. Hit backspace (simulated Back key) to return
    await page.keyboard.press('Backspace');
    await expect(dashboardScreen).toHaveClass(/active/);
    await expect(diagScreen).not.toHaveClass(/active/);
  });

  test('should toggle HbbTV red-button modal overlay using R key', async ({ page }) => {
    const modal = page.locator('#hbbtvModal');
    
    // 1. Initially hidden
    await expect(modal).not.toHaveClass(/active/);

    // 2. Press 'r' (PC red-button key) to open
    await page.keyboard.press('r');
    await expect(modal).toHaveClass(/active/);

    // 3. Press 'Escape' (Back key) to close
    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/active/);
  });

  test('should open player screen and handle video playback flow', async ({ page }) => {
    const playBtn = page.locator('#menu-btn-play');
    const playerScreen = page.locator('#screen-player');
    const dashboardScreen = page.locator('#screen-dashboard');
    const video = page.locator('#tvPlayer');
    const adOverlay = page.locator('#adOverlay');

    // 1. Initial State: Dashboard Screen Active
    await expect(dashboardScreen).toHaveClass(/active/);
    await expect(playerScreen).not.toHaveClass(/active/);

    // 2. Open Player Screen (Play Demo Stream button is focused by default, hit Enter)
    await expect(playBtn).toHaveClass(/focused/);
    await page.keyboard.press('Enter');

    // 3. Player Screen Opens
    await expect(playerScreen).toHaveClass(/active/);
    await expect(dashboardScreen).not.toHaveClass(/active/);

    // 4. Video Element Exists & Has Expected Source
    await expect(video).toBeAttached();
    const expectedSrc = 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4';
    await expect(video).toHaveAttribute('src', expectedSrc);

    // 5. Enter triggers playback/play-pause toggle
    await page.keyboard.press('Enter');

    // 6. Simulate time update to trigger the ad overlay
    await page.evaluate(() => {
      const videoEl = document.getElementById('tvPlayer');
      if (videoEl) {
        videoEl.currentTime = 6;
        videoEl.dispatchEvent(new Event('timeupdate'));
      }
    });

    // 7. Verify Ad Overlay appears
    await expect(adOverlay).toBeVisible();

    // 8. Escape returns back to home screen
    await page.keyboard.press('Escape');
    await expect(dashboardScreen).toHaveClass(/active/);
    await expect(playerScreen).not.toHaveClass(/active/);
  });

});
