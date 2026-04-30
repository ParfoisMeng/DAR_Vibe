// ============================================================
//  单元测试：战斗引擎 combat.ts
// ============================================================

import { describe, it, expect } from 'vitest';
import { calcCombat } from '../../src/engine/combat';
import { defaultStats } from '../../src/types';
import type { Enemy, Stats } from '../types';

// ── 测试用敌人 ────────────────────────────────────────────────

const normalEnemy: Enemy = {
  id: 'test_normal',
  name: '杂役散修',
  tier: 'normal',
  zone: 0,
  hp: 5000,
  atk: 30,
  atkSpeed: 1.0,
};

const eliteEnemy: Enemy = {
  id: 'test_elite',
  name: '试炼精英',
  tier: 'elite',
  zone: 0,
  hp: 18000,
  atk: 48,
  atkSpeed: 0.8,
};

const bossEnemy: Enemy = {
  id: 'test_boss',
  name: '试炼Boss',
  tier: 'boss',
  zone: 2,
  hp: 35000,
  atk: 62,
  atkSpeed: 0.6,
  dmgReduce: 0.15,
};

const strongPlayer: Stats = {
  ...defaultStats(),
  atk: 5000,
  atkSpeed: 2.0,
  critRate: 0.5,
  critDmg: 2.5,
  hp: 5000,
  maxHp: 5000,
};

const weakPlayer: Stats = {
  ...defaultStats(),
  atk: 10,
  atkSpeed: 0.1,
  hp: 100,
  maxHp: 100,
};

// ── 1. 普通怪始终胜利 ─────────────────────────────────────────

describe('普通怪战斗：始终胜利', () => {
  it('强力玩家 vs 普通怪 → 胜利', () => {
    const result = calcCombat(strongPlayer, normalEnemy);
    expect(result.victory).toBe(true);
  });

  it('极弱玩家 vs 普通怪 → 依然胜利（普通怪不扣血规则）', () => {
    const result = calcCombat(weakPlayer, normalEnemy);
    expect(result.victory).toBe(true);
  });
});

// ── 2. 精英/Boss 判定胜负 ────────────────────────────────────

describe('精英/Boss战：按伤害对比判定', () => {
  it('强力玩家 vs 精英 → 胜利', () => {
    const result = calcCombat(strongPlayer, eliteEnemy);
    expect(result.victory).toBe(true);
  });

  it('弱玩家 vs 精英 → 失败', () => {
    const result = calcCombat(weakPlayer, eliteEnemy);
    expect(result.victory).toBe(false);
  });

  it('强力玩家 vs Boss（带减伤）→ 胜利', () => {
    const result = calcCombat(strongPlayer, bossEnemy);
    expect(result.victory).toBe(true);
  });

  it('弱玩家 vs Boss → 失败', () => {
    const result = calcCombat(weakPlayer, bossEnemy);
    expect(result.victory).toBe(false);
  });
});

// ── 3. 战斗日志 ───────────────────────────────────────────────

describe('战斗日志：结构与内容', () => {
  it('结果包含日志数组（非空）', () => {
    const result = calcCombat(strongPlayer, normalEnemy);
    expect(result.logs).toBeDefined();
    expect(result.logs.length).toBeGreaterThan(0);
  });

  it('日志第一条为战斗开始（system 类型，含敌人名）', () => {
    const result = calcCombat(strongPlayer, normalEnemy);
    const firstLog = result.logs[0];
    expect(firstLog.type).toBe('system');
    expect(firstLog.text).toContain(normalEnemy.name);
  });

  it('有胜利日志时，日志中含胜利文字', () => {
    const result = calcCombat(strongPlayer, normalEnemy);
    const hasWin = result.logs.some(l => l.text.includes('溃败'));
    expect(hasWin).toBe(true);
  });

  it('失败时，日志中含失败文字', () => {
    const result = calcCombat(weakPlayer, eliteEnemy);
    const hasLose = result.logs.some(l => l.text.includes('根基耗尽'));
    expect(hasLose).toBe(true);
  });
});

// ── 4. DPS/数值合理性 ─────────────────────────────────────────

describe('数值合理性', () => {
  it('swordIntentGain 范围 0~100', () => {
    const result = calcCombat(strongPlayer, normalEnemy);
    expect(result.swordIntentGain).toBeGreaterThanOrEqual(0);
    expect(result.swordIntentGain).toBeLessThanOrEqual(100);
  });

  it('普通怪战斗后，玩家血量不变（始终等于初始血量）', () => {
    const result = calcCombat(strongPlayer, normalEnemy);
    expect(result.playerHpRemain).toBe(strongPlayer.hp);
  });

  it('精英战失败时，玩家血量降至 0（允许浮点误差）', () => {
    const result = calcCombat(weakPlayer, eliteEnemy);
    expect(result.playerHpRemain).toBeCloseTo(0, 5);
  });

  it('Boss 减伤 0.15 下，强力玩家仍能胜利', () => {
    const result = calcCombat(strongPlayer, bossEnemy);
    expect(result.victory).toBe(true);
  });
});
