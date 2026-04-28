// ============================================================
//  战斗结算引擎  (Day 1)
//  calcCombat(player, enemy) → CombatResult
// ============================================================

import type { Stats, Enemy, CombatResult, CombatLogEntry, LogType } from '../types';

// ── 仙侠动词日志模板 ──────────────────────────────────────
// 严禁机制描述词汇，只允许仙侠动词意象

const ATTACK_TEMPLATES = [
  '御剑横扫，{enemy}受到{dmg}点伤害',
  '剑光一闪，{enemy}被击中，损失{dmg}点根基',
  '真气外放，{enemy}被震退，受到{dmg}点伤害',
  '凌空踏虚，{enemy}躲闪不及，损失{dmg}点根基',
  '剑意催动，化剑为气刺入{enemy}，造成{dmg}点伤害',
  '一剑当先，{enemy}应声而退，受到{dmg}点伤害',
  '以意驭剑，无形剑气贯穿{enemy}，伤害{dmg}点',
  '身法如电，剑出{enemy}体，造成{dmg}点伤害',
];

const CRIT_TEMPLATES = [
  '会心一击！剑气贯穿{enemy}根基，重创{dmg}点！',
  '天机流转，此剑正中要害！{enemy}受到{dmg}点重创！',
  '剑意大盛，爆发一击！{enemy}损失{dmg}点根基！',
  '天人合一，一剑击破{enemy}防御，造成{dmg}点会心伤害！',
];

const ENEMY_ATTACK_TEMPLATES = [
  '{enemy}反扑，你护体真气消散{dmg}点',
  '{enemy}强横一击，你根基受损{dmg}点',
  '{enemy}施展秘术，你受到{dmg}点伤害',
];

const SWORD_INTENT_GAIN = '剑意积累至{si}层，道意渐深';
const BATTLE_START = '━━━ 征战 · {enemy} ━━━';
const BATTLE_END_WIN = '✦ {enemy}溃败，战斗结束';
const BATTLE_END_LOSE = '✗ 根基耗尽，{enemy}将你击败';

// ── 随机工具 ─────────────────────────────────────────────

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function formatNum(n: number): string {
  return Math.floor(n).toLocaleString();
}

function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));
}

// ── 核心 DPS 公式 ─────────────────────────────────────────
// DPS = ATK × AtkSpeed × CritCoeff × SwordIntentCoeff

function calcPlayerDPS(stats: Stats): number {
  // 基础暴击系数：(1-critRate) × 1 + critRate × critDmg
  const critCoeff = (1 - stats.critRate) + stats.critRate * stats.critDmg;
  // 剑意加成：每10层剑意 +5% 暴击率（叠加在基础上，上限100层=+50%）
  const swordIntentCritBonus = (stats.swordIntent / 100) * 0.5;
  const effectiveCritRate = Math.min(1, stats.critRate + swordIntentCritBonus);
  const effectiveCritCoeff = (1 - effectiveCritRate) + effectiveCritRate * stats.critDmg;
  return stats.atk * stats.atkSpeed * effectiveCritCoeff;
}

function calcEnemyDPS(enemy: Enemy): number {
  return enemy.atk * enemy.atkSpeed;
}

// ── 主结算函数 ────────────────────────────────────────────

export function calcCombat(
  playerStats: Stats,
  enemy: Enemy,
): CombatResult {
  const logs: CombatLogEntry[] = [];
  let t = 0; // 模拟时间戳（ms）

  const log = (text: string, type: LogType = 'normal'): void => {
    logs.push({ type, text, timestamp: t });
  };

  // 战斗开始
  log(fill(BATTLE_START, { enemy: enemy.name }), 'system');

  // ── 伤害计算 ─────────────────────────────────────────
  const playerDPS = calcPlayerDPS(playerStats);
  const enemyDPS = calcEnemyDPS(enemy);

  // 玩家有效DPS（穿透敌人减伤）
  const effectivePlayerDPS = playerDPS * (1 - (enemy.dmgReduce ?? 0));
  // 敌人有效DPS（扣除玩家减伤和闪避）
  const effectiveEnemyDPS = enemyDPS * (1 - playerStats.dmgReduce) * (1 - playerStats.dodge);

  // 击杀时间（秒）和死亡时间（秒）
  const killTimeS = enemy.hp / effectivePlayerDPS;
  const deathTimeS = (playerStats.hp + playerStats.shield) / Math.max(effectiveEnemyDPS, 0.001);

  // 普通怪不扣玩家血，始终胜利（GDD 5.1 规则）
  const victory = enemy.tier === 'normal' ? true : killTimeS <= deathTimeS;
  const durationS = enemy.tier === 'normal' ? killTimeS : (victory ? killTimeS : deathTimeS);
  const durationMs = Math.round(durationS * 1000);

  // ── 生成战斗过程日志 ─────────────────────────────────
  // 模拟攻击序列（每次攻击间隔 = 1/atkSpeed 秒）
  const attackInterval = 1000 / playerStats.atkSpeed;  // ms
  let simT = 0;
  let enemyHpRemain = enemy.hp;
  let swordIntentGain = 0;

  while (simT < durationMs && enemyHpRemain > 0) {
    t = simT;

    // 玩家攻击
    const isCrit = Math.random() < (playerStats.critRate + (playerStats.swordIntent / 100) * 0.5);
    const rawDmg = playerStats.atk * (isCrit ? playerStats.critDmg : 1);
    const finalDmg = rawDmg * (1 - (enemy.dmgReduce ?? 0));
    enemyHpRemain -= finalDmg;

    if (isCrit) {
      log(fill(randomItem(CRIT_TEMPLATES), { enemy: enemy.name, dmg: formatNum(finalDmg) }), 'crit');
    } else {
      log(fill(randomItem(ATTACK_TEMPLATES), { enemy: enemy.name, dmg: formatNum(finalDmg) }), 'normal');
    }

    // 剑意积累（每次攻击 +1~3 层，会心额外 +2）
    const siGain = (isCrit ? 3 : 1) + Math.floor(Math.random() * 2);
    swordIntentGain += siGain;
    const newSI = Math.min(100, playerStats.swordIntent + swordIntentGain);

    // 每5层剑意增长输出一次状态日志
    if (Math.floor((newSI) / 5) > Math.floor((newSI - siGain) / 5)) {
      log(fill(SWORD_INTENT_GAIN, { si: newSI }), 'normal');
    }

    simT += attackInterval;

    // 敌人反击（只在精英/Boss 造成实质伤害）
    if ((enemy.tier === 'elite' || enemy.tier === 'boss') && simT % 2000 < attackInterval) {
      const enemyDmgRaw = enemy.atk * (1 - playerStats.dmgReduce);
      log(fill(randomItem(ENEMY_ATTACK_TEMPLATES), { enemy: enemy.name, dmg: formatNum(enemyDmgRaw) }), 'normal');
    }
  }

  // 战斗结束
  t = durationMs;
  if (victory) {
    log(fill(BATTLE_END_WIN, { enemy: enemy.name }), 'system');
  } else {
    log(fill(BATTLE_END_LOSE, { enemy: enemy.name }), 'system');
  }

  // 计算战斗后玩家剩余HP
  let playerHpRemain = playerStats.hp;
  let playerShieldRemain = playerStats.shield;
  if (enemy.tier !== 'normal') {
    // 精英/Boss 扣血
    const totalDmgTaken = effectiveEnemyDPS * durationS;
    const shieldAbsorb = Math.min(playerStats.shield, totalDmgTaken);
    playerShieldRemain = playerStats.shield - shieldAbsorb;
    playerHpRemain = Math.max(0, playerStats.hp - (totalDmgTaken - shieldAbsorb));
  }

  return {
    victory,
    durationMs,
    playerHpRemain,
    playerShieldRemain,
    swordIntentGain,
    logs,
    lootRoll: Math.random(),
  };
}

// ── 简易 DPS 测试（控制台验证）─────────────────────────────

export function validateCombatEngine(): void {
  const { defaultStats } = require('../types') as typeof import('../types');
  const p = defaultStats();
  const normalEnemy: Enemy = {
    id: 'test_normal',
    name: '荒野煞魂',
    tier: 'normal',
    hp: 4500,
    atk: 80,
    atkSpeed: 0.8,
    dmgReduce: 0,
  };

  const result = calcCombat(p, normalEnemy);
  const durationS = result.durationMs / 1000;
  console.log(`[引擎验证] 筑基期 vs 普通怪: ${result.victory ? '胜利' : '失败'}, 耗时 ${durationS.toFixed(1)}秒`);
  console.log(`[引擎验证] 玩家DPS: ${calcPlayerDPS(p).toFixed(0)}, 目标范围: 击杀 6~15秒`);
  if (durationS >= 6 && durationS <= 15) {
    console.log('[引擎验证] ✅ 数值在目标范围内');
  } else {
    console.warn(`[引擎验证] ⚠️ 数值偏差，耗时 ${durationS.toFixed(1)}秒 (目标6~15秒)`);
  }
}
