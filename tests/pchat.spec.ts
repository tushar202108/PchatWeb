import { test, expect } from '@playwright/test';
import { argosScreenshot } from '@argos-ci/playwright';

test('pChat UI visual test', async ({ page }) => {
  // Point to port 5173 where your dev server is live
  await page.goto('http://127.0.0.1:5173');

  // Verify that the body or app container is visible
  await expect(page.locator('body')).toBeVisible();

  // Capture a screenshot and send it to Argos
  await argosScreenshot(page, 'pchat-homepage');
});