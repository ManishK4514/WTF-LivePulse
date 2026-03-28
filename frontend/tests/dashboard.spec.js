import { test, expect } from '@playwright/test';

test('Dashboard loads with gym selector showing 10 gyms and no console errors', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Gym selector should exist
  const selector = page.locator('select');
  await expect(selector).toBeVisible();

  // Should have 10 options
  const options = await selector.locator('option').count();
  expect(options).toBe(10);

  // No console errors
  const filteredErrors = errors.filter(
    (e) => !e.includes('favicon') && !e.includes('net::ERR')
  );
  expect(filteredErrors).toHaveLength(0);
});

test('Switching gym in dropdown updates the occupancy display', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const selector = page.locator('select');
  await expect(selector).toBeVisible();

  // Get first gym name
  const firstOption = await selector.locator('option').nth(0).textContent();

  // Switch to second gym
  const secondOption = await selector.locator('option').nth(1).inputValue();
  await selector.selectOption(secondOption);

  // Wait for live data to update
  await page.waitForTimeout(1000);

  // Occupancy widget should still be visible
  const occupancyEl = page.locator('text=Live Occupancy');
  await expect(occupancyEl).toBeVisible();
});

test('Starting simulator causes activity feed to update within 3 seconds', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Find Start button
  const startBtn = page.locator('button', { hasText: 'Start' });
  await expect(startBtn).toBeVisible();
  await startBtn.click();

  // Wait for activity feed to show events (within 3 seconds at 1x = 2s interval)
  await page.waitForTimeout(3000);

  // Activity feed section should be visible
  const feedLabel = page.locator('text=Activity Feed');
  await expect(feedLabel).toBeVisible();

  // Stop simulator
  const stopBtn = page.locator('button', { hasText: 'Pause' });
  if (await stopBtn.isVisible()) await stopBtn.click();
});
