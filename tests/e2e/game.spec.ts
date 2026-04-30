// ============================================================
//  E2E 测试：游戏核心流程 (Playwright)
// ============================================================

import { test, expect, Page } from '@playwright/test';

// ── 工具函数 ──────────────────────────────────────────────────

/** 等待战斗日志区域出现特定文字 */
async function waitForLog(page: Page, text: string, timeout = 15000) {
  await expect(page.locator('#combat-log-container')).toContainText(text, { timeout });
}

/** 等待行动区出现特定按钮并点击 */
async function clickContinue(page: Page, timeout = 15000) {
  const btn = page.locator('#action-choices .btn').first();
  await btn.waitFor({ state: 'visible', timeout });
  await btn.click();
}

// ── 1. 页面基础加载 ───────────────────────────────────────────

test.describe('页面加载', () => {
  test('打开游戏，显示灵根选择界面', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#spirit-select')).toBeVisible();
    await expect(page.locator('.spirit-title')).toHaveText('问道无界');
  });

  test('灵根选择界面有「纯阳剑灵根」卡片', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.spirit-card').first()).toContainText('纯阳剑灵根');
  });

  test('主游戏界面初始隐藏', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app')).toBeHidden();
  });
});

// ── 2. 游戏启动 ───────────────────────────────────────────────

test.describe('灵根选择与游戏启动', () => {
  test('选择剑灵根后，灵根选择界面消失，游戏界面显示', async ({ page }) => {
    await page.goto('/');
    await page.locator('.spirit-card').first().click();
    await expect(page.locator('#spirit-select')).toBeHidden({ timeout: 3000 });
    await expect(page.locator('#app')).toBeVisible({ timeout: 3000 });
  });

  test('游戏启动后，战斗日志出现初始文字', async ({ page }) => {
    await page.goto('/');
    await page.locator('.spirit-card').first().click();
    await expect(page.locator('#combat-log-container')).not.toBeEmpty({ timeout: 5000 });
  });

  test('游戏启动后，左侧状态面板可见', async ({ page }) => {
    await page.goto('/');
    await page.locator('.spirit-card').first().click();
    await expect(page.locator('#panel-left')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#stat-atk')).toBeVisible();
  });
});

// ── 3. 设置 Modal ─────────────────────────────────────────────

test.describe('设置 Modal（存档管理）', () => {
  test('灵根选择界面有「⚙ 存档管理」链接', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#spirit-select span[onclick*="openSettings"]')).toBeVisible();
  });

  test('点击「⚙ 存档管理」，设置 Modal 显示', async ({ page }) => {
    await page.goto('/');
    await page.locator('#spirit-select span[onclick*="openSettings"]').click();
    await expect(page.locator('#settings-modal')).toBeVisible({ timeout: 2000 });
  });

  test('设置 Modal 包含导出/导入/清档三个功能区', async ({ page }) => {
    await page.goto('/');
    await page.locator('#spirit-select span[onclick*="openSettings"]').click();
    await expect(page.locator('#settings-modal')).toContainText('导出存档码');
    await expect(page.locator('#settings-modal')).toContainText('导入存档码');
    await expect(page.locator('#settings-modal')).toContainText('清空所有存档');
  });

  test('点击关闭按钮，设置 Modal 隐藏', async ({ page }) => {
    await page.goto('/');
    await page.locator('#spirit-select span[onclick*="openSettings"]').click();
    await page.locator('#settings-modal button:has-text("关闭")').click();
    await expect(page.locator('#settings-modal')).toBeHidden({ timeout: 2000 });
  });

  test('游戏进行中，右侧面板 ⚙ 按钮可开启设置', async ({ page }) => {
    await page.goto('/');
    await page.locator('.spirit-card').first().click();
    await expect(page.locator('#app')).toBeVisible({ timeout: 3000 });
    await page.locator('#panel-right button[title="存档管理"]').click();
    await expect(page.locator('#settings-modal')).toBeVisible({ timeout: 2000 });
  });
});

// ── 4. 断点续玩：续局按钮 ─────────────────────────────────────

test.describe('断点续玩', () => {
  test('初始无快照时，续局按钮隐藏', async ({ page }) => {
    await page.goto('/');
    // 清除 localStorage 保证没有快照
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('#resume-section')).toBeHidden();
  });

  test('注入快照后刷新，续局按钮显示', async ({ page }) => {
    await page.goto('/');
    // 注入一个模拟快照到 localStorage
    await page.evaluate(() => {
      const snap = {
        runId: 'test_run_e2e',
        spiritRoot: 'sword',
        currentZone: 1,
        currentNodeIndex: 3,
        phase: 'zoneStart',
        stats: {
          hp: 2500, maxHp: 2500, shield: 0, atk: 550, atkSpeed: 1.2,
          critRate: 0.15, critDmg: 1.5, dmgReduce: 0, dodge: 0,
          luckDrop: 0, fateDest: 0, swordIntent: 20,
        },
        equippedItems: {},
        inventory: [],
        skillTree: [{ id: 'sk_1', name: '御剑术' }],
        activeSynergies: [],
        materials: 0,
        daoYun: 8,
        heavenlyMomentHistory: [],
        combatCount: 5,
        synergyTriggerCount: 0,
      };
      localStorage.setItem('dar_vibe_run_snapshot', JSON.stringify(snap));
    });
    await page.reload();
    await expect(page.locator('#resume-section')).toBeVisible({ timeout: 3000 });
  });

  test('续局按钮文字包含区域和场次信息', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const snap = {
        runId: 'test_run_e2e',
        spiritRoot: 'sword',
        currentZone: 1,
        phase: 'zoneStart',
        stats: { hp: 2500, maxHp: 2500, shield: 0, atk: 550, atkSpeed: 1.2,
          critRate: 0.15, critDmg: 1.5, dmgReduce: 0, dodge: 0,
          luckDrop: 0, fateDest: 0, swordIntent: 0 },
        equippedItems: {},
        inventory: [],
        skillTree: [],
        activeSynergies: [],
        materials: 0,
        daoYun: 5,
        heavenlyMomentHistory: [],
        combatCount: 3,
        synergyTriggerCount: 0,
      };
      localStorage.setItem('dar_vibe_run_snapshot', JSON.stringify(snap));
    });
    await page.reload();
    await expect(page.locator('#btn-resume')).toContainText('幽冥古道', { timeout: 3000 });
    await expect(page.locator('#btn-resume')).toContainText('战3场');
  });
});

// ── 5. 存档码导出 ─────────────────────────────────────────────

test.describe('存档码导出', () => {
  test('点击导出，收到剪贴板写入成功提示（或代码显示提示）', async ({ page, context }) => {
    // 授权剪贴板权限
    await context.grantPermissions(['clipboard-write']);
    await page.goto('/');
    await page.locator('#spirit-select span[onclick*="openSettings"]').click();
    // 监听 dialog（alert）
    const alertPromise = page.waitForEvent('dialog');
    await page.locator('#settings-modal button:has-text("复制存档码")').click();
    const dialog = await alertPromise;
    expect(dialog.message()).toContain('存档码');
    await dialog.accept();
  });
});
