import { expect, test } from '@playwright/test';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

test('campus photos open in the keyboard-accessible viewer', async ({ page }, testInfo) => {
  await page.goto('/gallery');
  const firstTile = page.getByRole('button', { name: 'View full-size image: A campus made for children' });
  await expect(firstTile).toBeVisible();
  await firstTile.click();

  const viewer = page.getByRole('dialog', { name: 'Campus photo viewer' });
  await expect(viewer).toBeVisible();
  await expect(viewer.getByRole('heading', { name: 'A campus made for children' })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('campus-lightbox.png') });

  await page.keyboard.press('ArrowRight');
  await expect(viewer.getByRole('heading', { name: 'Learning in every corner' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(viewer).not.toBeVisible();
});
test('admin can sign in, create and edit a draft article, and clean it up', async ({ page }, testInfo) => {
  const password = process.env.SSTBAC_E2E_ADMIN_PASSWORD;
  test.skip(!password, 'Set SSTBAC_E2E_ADMIN_PASSWORD to run authenticated admin coverage.');

  const headline = 'QA ONLY — admin workflow ' + Date.now();
  const updatedSummary = 'QA verification: the admin editor saved this updated summary.';
  let createdId = null;
  let uploadedImage = null;

  try {
    await page.goto('/admin');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Good morning.' })).toBeVisible();

    await page.getByRole('button', { name: 'News & notices' }).click();
    await page.getByRole('button', { name: 'New update' }).click();
    await page.screenshot({ path: testInfo.outputPath('admin-news-editor.png'), fullPage: true });
    await page.getByLabel('Headline').fill(headline);
    await page.getByLabel('Category').fill('Automated QA');
    await page.getByLabel('Short summary').fill('QA ONLY: temporary draft used to verify article creation and editing.');
    await page.getByLabel('Full article').fill('This temporary draft verifies that the school admin can save and update a full article. It is not for publication.');
    await page.locator('input[type="file"]').setInputFiles(resolve('public/brand/campus/innovation-mural.jpg'));
    await page.getByRole('button', { name: 'Save draft' }).click();

    await expect(page.getByRole('heading', { name: 'News & notices' })).toBeVisible();
    const listResponse = await page.request.get('/api/admin/news');
    expect(listResponse.ok()).toBeTruthy();
    const { items } = await listResponse.json();
    const createdItem = items.find((item) => item.title === headline);
    expect(createdItem).toBeTruthy();
    createdId = createdItem.id;
    uploadedImage = createdItem.image;
    expect(createdItem.published).toBe(false);
    expect(createdItem.body).toContain('temporary draft');

    const row = page.locator('.admin-news-row').filter({ hasText: headline });
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: 'Edit ' + headline }).click();
    await expect(page.getByLabel('Headline')).toHaveValue(headline);
    await page.getByLabel('Short summary').fill(updatedSummary);
    await page.getByRole('button', { name: 'Save draft' }).click();
    await expect(page.locator('.admin-news-row').filter({ hasText: updatedSummary })).toBeVisible();
  } finally {
    if (!createdId) {
      try {
        const response = await page.request.get('/api/admin/news');
        if (response.ok()) {
          const { items } = await response.json();
          const leftover = items.find((item) => item.title === headline);
          if (leftover) {
            createdId = leftover.id;
            uploadedImage = leftover.image;
          }
        }
      } catch {
        // A failed sign-in or create request means there may be nothing to clean up.
      }
    }
    if (createdId) {
      const sessionResponse = await page.request.get('/api/admin/session');
      expect(sessionResponse.ok()).toBeTruthy();
      const { csrf } = await sessionResponse.json();
      const deleteResponse = await page.request.delete('/api/admin/news/' + createdId, {
        headers: { 'X-CSRF-Token': csrf },
      });
      expect(deleteResponse.ok()).toBeTruthy();
      if (uploadedImage) {
        expect(existsSync(resolve('public', uploadedImage))).toBe(false);
      }
    }
  }
});

test('multiple published articles keep their images, card layout, and paragraph structure', async ({ page }) => {
  const password = process.env.SSTBAC_E2E_ADMIN_PASSWORD;
  test.skip(!password, 'Set SSTBAC_E2E_ADMIN_PASSWORD to run authenticated admin coverage.');

  const prefix = 'Temporary campus update ' + Date.now();
  const titles = [prefix + ' — first story', prefix + ' — second story'];
  const uploadedImages = new Set();
  const imageFixture = resolve('public/brand/campus/innovation-mural.jpg');

  try {
    await page.goto('/admin');
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.getByRole('heading', { name: 'Good morning.' })).toBeVisible();
    await page.getByRole('button', { name: 'News & notices' }).click();

    for (const [index, title] of titles.entries()) {
      await page.getByRole('button', { name: 'New update' }).click();
      await page.getByLabel('Headline').fill(title);
      await page.getByLabel('Category').fill('Campus life');
      await page.getByLabel('Short summary').fill('A temporary article used to check the school news layout and image delivery.');
      await page.getByLabel('Full article').fill([
        'First paragraph: learners explore a new idea through a guided activity.',
        'Second paragraph: the class shares observations and asks thoughtful questions.',
        'Third paragraph: each learner records what they discovered and what they want to try next.',
      ].join('\n\n'));
      await page.locator('input[type="file"]').setInputFiles(imageFixture);
      await page.locator('.admin-publish-toggle strong').click();
      await expect(page.locator('.admin-publish-toggle input')).toBeChecked();
      await page.getByRole('button', { name: 'Publish update' }).click();
      await expect(page.locator('.admin-news-row').filter({ hasText: title })).toBeVisible();
    }

    const adminResponse = await page.request.get('/api/admin/news');
    expect(adminResponse.ok()).toBeTruthy();
    const { items: adminItems } = await adminResponse.json();
    const createdItems = titles.map((title) => adminItems.find((item) => item.title === title));
    expect(createdItems.every(Boolean)).toBe(true);
    for (const item of createdItems) {
      expect(item.published).toBe(true);
      expect(item.image).toMatch(/^uploads\/news\/[a-f0-9]{32}\.jpg$/);
      uploadedImages.add(item.image);
    }

    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/news');
    for (const item of createdItems) {
      const card = page.locator('.news-grid article').filter({ hasText: item.title });
      await expect(card).toBeVisible();

      const imageUrl = '/' + item.image;
      await expect.poll(async () => {
        const response = await page.request.get(imageUrl);
        return `${response.status()} ${response.headers()['content-type'] || ''}`;
      }).toMatch(/^200 image\/jpeg/);

      const cardImage = card.locator('.news-card-image img');
      await expect.poll(() => cardImage.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
      await expect.poll(() => cardImage.evaluate((image, imagePath) => image.currentSrc.endsWith(imagePath), item.image)).toBe(true);

      const imageBox = await card.locator('.news-card-image').boundingBox();
      const copyBox = await card.locator(':scope > div').boundingBox();
      expect(imageBox).toBeTruthy();
      expect(copyBox).toBeTruthy();
      expect(imageBox.y + imageBox.height).toBeLessThanOrEqual(copyBox.y + 1);

      await card.getByRole('heading', { name: item.title, exact: true }).click();
      const paragraphs = page.locator('.news-story-body p');
      await expect(paragraphs).toHaveCount(3);
      await expect(paragraphs.nth(0)).toContainText('First paragraph');
      await expect(paragraphs.nth(1)).toContainText('Second paragraph');
      await expect(paragraphs.nth(2)).toContainText('Third paragraph');
      await page.goto('/news');
    }

    await page.setViewportSize({ width: 390, height: 844 });
    for (const title of titles) {
      const card = page.locator('.news-grid article').filter({ hasText: title });
      await expect(card).toBeVisible();
      const imageBox = await card.locator('.news-card-image').boundingBox();
      const copyBox = await card.locator(':scope > div').boundingBox();
      const cardBox = await card.boundingBox();
      expect(imageBox).toBeTruthy();
      expect(copyBox).toBeTruthy();
      expect(cardBox).toBeTruthy();
      expect(imageBox.y + imageBox.height).toBeLessThanOrEqual(copyBox.y + 1);
      expect(imageBox.width).toBeLessThanOrEqual(cardBox.width + 1);
    }
  } finally {
    const response = await page.request.get('/api/admin/news');
    if (response.ok()) {
      const { items = [] } = await response.json();
      const temporaryItems = items.filter((item) => titles.includes(item.title));
      const sessionResponse = await page.request.get('/api/admin/session');
      expect(sessionResponse.ok()).toBeTruthy();
      const { csrf } = await sessionResponse.json();

      for (const item of temporaryItems) {
        if (item.image) uploadedImages.add(item.image);
        const deleteResponse = await page.request.delete('/api/admin/news/' + item.id, {
          headers: { 'X-CSRF-Token': csrf },
        });
        expect(deleteResponse.ok()).toBeTruthy();
      }
    }

    for (const image of uploadedImages) {
      expect(existsSync(resolve('public', image))).toBe(false);
    }
  }
});

