import { test, expect } from '@playwright/test';
import { emptyContext, type SessionView } from '../../src/lib/contracts';

test('alur vertikal: tiga jawaban pendek, evaluasi panjang, buka/tutup tanpa ruang cadangan', async ({ page, request }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const profileResponse = await request.post('/api/profiles', { data: {
    ...emptyContext, title: `Regresi alur vertikal ${testInfo.project.name}`,
    background: 'Data sintetis untuk memeriksa aliran percakapan dengan evaluasi panjang.',
    goals: 'Memastikan evaluasi lengkap dapat dibaca tanpa mencadangkan ruang kosong di samping jawaban.',
  } });
  expect(profileResponse.ok()).toBe(true);
  const profile = await profileResponse.json();
  const sessionResponse = await request.post('/api/sessions', { data: { profileId: profile.id, mode: 'latihan', total: 3, weaknessIds: [] } });
  expect(sessionResponse.ok()).toBe(true);
  const session = await sessionResponse.json();
  await page.goto(`/?sesi=${session.id}`);
  await page.getByRole('button', { name: 'Mulai pertanyaan', exact: true }).click();
  for (let index = 0; index < 3; index++) {
    await page.getByLabel('Jawabanmu').fill(`Jawaban singkat ${index + 1}.`);
    await page.getByRole('button', { name: 'Kirim jawaban', exact: true }).click();
    await expect(page.locator('.evaluation-block')).toHaveCount(index + 1);
  }
  const cards = page.locator('.turn-card');
  const documentBox = (index: number) => cards.nth(index).evaluate(element => {
    const bounds = element.getBoundingClientRect();
    return { y: bounds.y + window.scrollY, height: bounds.height };
  });
  await expect(cards).toHaveCount(4);
  const details = page.locator('.evaluation-details');
  await expect(details).toHaveCount(3);
  for (let index = 0; index < 3; index++) {
    const card = cards.nth(index);
    await expect(card.locator('.evaluation-summary')).toBeVisible();
    await expect(card.locator('.evaluation-detail-content')).not.toBeVisible();
    const question = (await card.locator('.question-block').boundingBox())!;
    const answer = (await card.locator('.student-block').boundingBox())!;
    const evaluation = (await card.locator('.evaluation-block').boundingBox())!;
    const current = (await card.boundingBox())!;
    const next = (await cards.nth(index + 1).boundingBox())!;
    expect(question.y + question.height).toBeLessThanOrEqual(answer.y);
    expect(answer.y + answer.height).toBeLessThanOrEqual(evaluation.y);
    expect(current.width).toBeLessThanOrEqual(780);
    expect(Math.abs(current.x - next.x)).toBeLessThan(2);
    expect(next.y - current.y - current.height).toBeGreaterThanOrEqual(24);
    expect(next.y - current.y - current.height).toBeLessThanOrEqual(32);
    // Tidak ada tinggi/min-height, max-height, atau clipping pada blok percakapan.
    const sizing = await card.evaluate(element => {
      const style = getComputedStyle(element);
      return { minHeight: style.minHeight, maxHeight: style.maxHeight, overflow: style.overflowY };
    });
    expect(['auto', '0px']).toContain(sizing.minHeight);
    expect(sizing.maxHeight).toBe('none');
    expect(sizing.overflow).toBe('visible');
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('01-rincian-tertutup.png'), fullPage: true });

  const first = cards.first();
  const before = await documentBox(0);
  const nextBefore = await documentBox(1);
  const toggle = first.locator('.evaluation-details > summary');
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(first.locator('.evaluation-details')).toHaveAttribute('open', '');
  await expect(first.getByRole('heading', { name: 'Empat aspek evaluasi' })).toBeVisible();
  const dto: SessionView = await (await request.get(`/api/sessions/${session.id}`)).json();
  const findings = first.locator('.finding');
  await expect(findings).toHaveCount(3);
  for (let index = 0; index < 3; index++) {
    await expect(findings.nth(index).locator('.evidence-reason > p')).toHaveText(dto.turns[0].evaluation!.weaknesses[index].reason);
    await expect(findings.nth(index).locator('.improvement > p')).toHaveText(dto.turns[0].evaluation!.weaknesses[index].improvement);
    const clipping = await findings.nth(index).locator('.evidence-reason > p').evaluate(element => element.scrollHeight > element.clientHeight + 1);
    expect(clipping).toBe(false);
  }
  const expanded = await documentBox(0);
  const nextExpanded = await documentBox(1);
  expect(expanded.height - before.height).toBeGreaterThan(600);
  expect(Math.abs((nextExpanded.y - nextBefore.y) - (expanded.height - before.height))).toBeLessThan(2);
  expect(nextExpanded.y - expanded.y - expanded.height).toBeLessThanOrEqual(32);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await first.screenshot({ path: testInfo.outputPath('02-rincian-terbuka.png') });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(first.locator('.evaluation-details')).not.toHaveAttribute('open');
  expect(Math.abs((await documentBox(0)).height - before.height)).toBeLessThan(2);
  expect(Math.abs((await documentBox(1)).y - nextBefore.y)).toBeLessThan(2);
  await page.getByRole('button', { name: 'Akhiri sesi lebih awal' }).click();
  await expect(page.getByRole('heading', { name: 'Hasil sesi', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
