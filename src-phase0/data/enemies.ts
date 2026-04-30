// ============================================================
//  Phase 0 敌人数据（Day 1）
//  2个区域 + 1个Boss，共12种敌人
// ============================================================

import type { Enemy, BossPhase } from '../types';

// ── 第一区域：北荒边境 ───────────────────────────────────

export const ZONE1_ENEMIES: Enemy[] = [
  {
    id: 'z1_e1',
    name: '荒野煞魂',
    tier: 'normal',
    hp: 3800,
    atk: 65,
    atkSpeed: 0.8,
    dmgReduce: 0,
  },
  {
    id: 'z1_e2',
    name: '赤焰野狼',
    tier: 'normal',
    hp: 4200,
    atk: 72,
    atkSpeed: 1.0,
    dmgReduce: 0,
  },
  {
    id: 'z1_e3',
    name: '枯骨魔修',
    tier: 'normal',
    hp: 5500,
    atk: 58,
    atkSpeed: 0.7,
    dmgReduce: 0.05,
  },
  {
    id: 'z1_elite',
    name: '枯骨魔将',
    tier: 'elite',
    hp: 18000,
    atk: 48,
    atkSpeed: 0.8,
    dmgReduce: 0.1,
  },
];

// ── 第二区域：幽冥古道 ───────────────────────────────────

export const ZONE2_ENEMIES: Enemy[] = [
  {
    id: 'z2_e1',
    name: '幽冥厉鬼',
    tier: 'normal',
    hp: 6200,
    atk: 95,
    atkSpeed: 0.9,
    dmgReduce: 0,
  },
  {
    id: 'z2_e2',
    name: '噬魂傀儡',
    tier: 'normal',
    hp: 6400,
    atk: 85,
    atkSpeed: 0.8,
    dmgReduce: 0.08,
  },
  {
    id: 'z2_e3',
    name: '血月魔修',
    tier: 'normal',
    hp: 5800,
    atk: 110,
    atkSpeed: 1.1,
    dmgReduce: 0,
  },
  {
    id: 'z2_elite',
    name: '幽冥血煞',
    tier: 'elite',
    hp: 20000,
    atk: 55,
    atkSpeed: 0.75,
    dmgReduce: 0.12,
  },
];

// ── Boss：苍狼王 ──────────────────────────────────────────

const BOSS_PHASES: BossPhase[] = [
  {
    triggerHpPct: 0.5,
    description: '苍狼王·狂化',
    buffKey: 'boss_berserker', // 攻击力+50%，但防御-20%
  },
];

export const BOSS_CANG_LANG: Enemy = {
  id: 'boss_cang_lang',
  name: '苍狼王',
  tier: 'boss',
  hp: 35000,  // 第Phase 0裸装数值；天机时刻的爬发技能能大幅缩短实际战斗时长
  atk: 62,
  atkSpeed: 0.6,
  dmgReduce: 0.15,
  phases: BOSS_PHASES,
};

// ── 随机抽取普通/精英敌人 ─────────────────────────────────

export function getRandomEnemy(zone: 1 | 2, isElite = false): Enemy {
  const pool = zone === 1 ? ZONE1_ENEMIES : ZONE2_ENEMIES;
  if (isElite) {
    return pool.find(e => e.tier === 'elite')!;
  }
  const normals = pool.filter(e => e.tier === 'normal');
  return normals[Math.floor(Math.random() * normals.length)];
}
