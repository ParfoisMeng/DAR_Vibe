// ============================================================
//  自动跑局测试：Day 12~13 验收
//  - 10局连续自动推进
//  - 报告：时长 / 协同次数 / 通关
// ============================================================

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const TOTAL_RUNS = 10;
const SYNERGY_TARGET = 6;  // 10局中至少6局触发协同

test('10局自动跑局验收', async ({ page }) => {
  test.setTimeout(30 * 60 * 1000);

  const results: { run: number; durationMs: number; synergyCount: number; completed: boolean }[] = [];

  for (let runIdx = 1; runIdx <= TOTAL_RUNS; runIdx++) {
    console.log(`\n━━━ 开始第 ${runIdx}/${TOTAL_RUNS} 局 ━━━`);

    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('dar_vibe_run_snapshot'));
    await page.locator('.spirit-card').first().click();
    await expect(page.locator('#app')).toBeVisible({ timeout: 5000 });

    const startTime = Date.now();
    let steps = 0;
    let completed = false;

    while (steps < 3000) {
      steps++;

      const runEndVisible = await page.locator('#run-end.active').isVisible().catch(() => false);
      if (runEndVisible) { completed = true; break; }

      let clicked = false;

      // 天机时刻
      if (!clicked) {
        const hmOpts = page.locator('#hm-overlay.active .hm-opt:not(.hm-opt-locked)');
        if (await hmOpts.count() > 0) { await hmOpts.first().click(); clicked = true; }
      }
      // 择法
      if (!clicked) {
        const spCards = page.locator('#skill-pick.active .sp-card');
        if (await spCards.count() > 0) { await spCards.first().click(); clicked = true; }
      }
      // 事件
      if (!clicked) {
        const evChoices = page.locator('#event-panel.active .ev-choice');
        if (await evChoices.count() > 0) { await evChoices.first().click(); clicked = true; }
      }
      // 装备（存仓库）
      if (!clicked) {
        const lootVisible = await page.locator('#loot-panel.active').isVisible().catch(() => false);
        if (lootVisible) { await page.locator('#loot-panel button:has-text("存仓库")').click(); clicked = true; }
      }
      // 继续按钮
      if (!clicked) {
        const btns = page.locator('#action-choices .btn:not(:disabled)');
        if (await btns.count() > 0) { await btns.first().click(); clicked = true; }
      }

      await page.waitForTimeout(clicked ? 50 : 200);
    }

    const durationMs = Date.now() - startTime;
    const synergyCount = await page.locator('#combat-log-container .log-synergy').count().catch(() => 0);
    results.push({ run: runIdx, durationMs, synergyCount, completed });

    const min = (durationMs / 60000).toFixed(1);
    console.log(`  局${runIdx}: ${min}分钟 | 协同${synergyCount}次 | 完成:${completed}`);
  }

  // 汇总
  const completedCount = results.filter(r => r.completed).length;
  const synergyRuns = results.filter(r => r.synergyCount >= 1).length;
  const avgMin = (results.reduce((s, r) => s + r.durationMs, 0) / results.length / 60000).toFixed(1);
  const avgSyn = (results.reduce((s, r) => s + r.synergyCount, 0) / results.length).toFixed(1);

  console.log('\n╔════════ 验收汇总 ════════╗');
  results.forEach(r => {
    const m = (r.durationMs / 60000).toFixed(1);
    console.log(`  局${r.run}: ${m}分钟 协同${r.synergyCount}次 ${r.synergyCount>=1?'✅':'❌'} [${r.completed?'完成':'超时'}]`);
  });
  console.log(`\n 完成: ${completedCount}/${TOTAL_RUNS}`);
  console.log(` 协同: ${synergyRuns}/${TOTAL_RUNS} 局触发（人工目标8/10）`);
  console.log(` 均时: ${avgMin} 分钟（自动化，非真实游玩时长）`);
  console.log(` 均协: ${avgSyn} 次/局`);
  console.log('\n H1~H4假设需人工游玩验证（见docs/DEV_PLAN.md Day14）');
  console.log('╚══════════════════════════╝\n');

  // 保存报告
  const report = {
    timestamp: new Date().toISOString(),
    completedRuns: completedCount,
    synergyRunCount: synergyRuns,
    avgDurationMin: parseFloat(avgMin),
    avgSynergyPerRun: parseFloat(avgSyn),
    details: results.map(r => ({ ...r, durationMin: parseFloat((r.durationMs/60000).toFixed(1)) })),
  };
  const reportPath = path.join(process.cwd(), 'test-results', 'run-validation-report.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // 断言
  expect(completedCount, '至少8局正常完成').toBeGreaterThanOrEqual(8);
  expect(synergyRuns, `至少${SYNERGY_TARGET}局触发协同`).toBeGreaterThanOrEqual(SYNERGY_TARGET);
});
