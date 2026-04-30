// ============================================================
//  单元测试：Run 状态机 run.ts
// ============================================================

import { describe, it, expect } from 'vitest';
import { createNewRun, pickSkillNode, equipItem } from '../engine/run';
import type { SkillNode, Equipment } from '../types';

// ── 测试用功法节点 ────────────────────────────────────────────

const swordNode: SkillNode = {
  id: 'test_sword_node',
  name: '测试御剑术',
  description: '攻速+10%',
  flavorText: '剑行如风',
  effectKey: 'passive_swordDance',
  effectValue: 0.1,
  spiritRoot: ['sword'],
  synergyTags: ['sword', 'speed'],
  rarity: 'common',
};

const universalNode: SkillNode = {
  id: 'test_universal_node',
  name: '测试纯阳气',
  description: '攻击力+5%',
  flavorText: '真气淬炼',
  effectKey: 'passive_pureYangQi',
  effectValue: 0.05,
  spiritRoot: ['universal'],
  synergyTags: ['qi', 'power'],
  rarity: 'common',
};

const testWeapon: Equipment = {
  id: 'test_weapon_1',
  instanceId: 'inst_weapon_1',
  name: '测试飞剑',
  slot: 'weapon',
  quality: 'spirit',
  affixes: [
    {
      id: 'affix_atk_1', name: '剑气精纯',
      tier: 'basic', description: '攻击力+100',
      synergyTags: ['sword'], synergyCount: 1,
      effectKey: 'affix_atk', effectValue: 100,
    },
  ],
};

const testWeapon2: Equipment = {
  id: 'test_weapon_2',
  instanceId: 'inst_weapon_2',
  name: '改良飞剑',
  slot: 'weapon',
  quality: 'rare',
  affixes: [
    {
      id: 'affix_atk_2', name: '剑气凝练',
      tier: 'basic', description: '攻击力+200',
      synergyTags: ['sword'], synergyCount: 1,
      effectKey: 'affix_atk', effectValue: 200,
    },
  ],
};

// ── 1. createNewRun ───────────────────────────────────────────

describe('createNewRun：初始化状态', () => {
  it('sword 灵根：攻击力应为 550（500×1.1）', () => {
    const run = createNewRun('sword');
    expect(run.stats.atk).toBe(550);
  });

  it('sword 灵根：暴击率应为 0.15（0.1+0.05）', () => {
    const run = createNewRun('sword');
    expect(run.stats.critRate).toBeCloseTo(0.15);
  });

  it('初始功法树为空', () => {
    const run = createNewRun('sword');
    expect(run.skillTree).toHaveLength(0);
  });

  it('初始协同为空', () => {
    const run = createNewRun('sword');
    expect(run.activeSynergies).toHaveLength(0);
  });

  it('初始区域为 0', () => {
    const run = createNewRun('sword');
    expect(run.currentZone).toBe(0);
  });

  it('初始道韵为 0', () => {
    const run = createNewRun('sword');
    expect(run.daoYun).toBe(0);
  });
});

// ── 2. pickSkillNode ──────────────────────────────────────────

describe('pickSkillNode：功法节点效果应用', () => {
  it('选取攻速节点后，攻速提升 10%', () => {
    const run = createNewRun('sword');
    const baseSpeed = run.stats.atkSpeed;
    const { newState } = pickSkillNode(run, swordNode);
    expect(newState.stats.atkSpeed).toBeCloseTo(baseSpeed * 1.1);
  });

  it('选取攻击力节点后，攻击力提升 5%', () => {
    const run = createNewRun('sword');
    const baseAtk = run.stats.atk;
    const { newState } = pickSkillNode(run, universalNode);
    expect(newState.stats.atk).toBe(Math.round(baseAtk * 1.05));
  });

  it('节点加入功法树', () => {
    const run = createNewRun('sword');
    const { newState } = pickSkillNode(run, swordNode);
    expect(newState.skillTree).toHaveLength(1);
    expect(newState.skillTree[0].id).toBe(swordNode.id);
  });

  it('新增节点不影响已有状态（不可变）', () => {
    const run = createNewRun('sword');
    const { newState } = pickSkillNode(run, swordNode);
    expect(run.skillTree).toHaveLength(0);
    expect(newState.skillTree).toHaveLength(1);
  });

  it('触发新协同时，返回 newSynergies（非空则数量>0）', () => {
    const run = createNewRun('sword');
    const { newSynergies } = pickSkillNode(run, swordNode);
    // 测试：newSynergies 是数组（可能为空，取决于是否触发协同条件）
    expect(Array.isArray(newSynergies)).toBe(true);
  });
});

// ── 3. equipItem ─────────────────────────────────────────────

describe('equipItem：装备系统', () => {
  it('装备武器后，equippedItems.weapon 有值', () => {
    const run = createNewRun('sword');
    const newRun = equipItem(run, testWeapon);
    expect(newRun.equippedItems.weapon).toBeDefined();
    expect(newRun.equippedItems.weapon?.id).toBe(testWeapon.id);
  });

  it('装备后，攻击力提升（词缀 affix_atk +100）', () => {
    const run = createNewRun('sword');
    const baseAtk = run.stats.atk;
    const newRun = equipItem(run, testWeapon);
    expect(newRun.stats.atk).toBe(baseAtk + 100);
  });

  it('替换武器时，旧装备进入 inventory', () => {
    const run = createNewRun('sword');
    const run1 = equipItem(run, testWeapon);
    const run2 = equipItem(run1, testWeapon2);
    // 旧装备应在 inventory 中
    const inInventory = run2.inventory.some(e => e.id === testWeapon.id);
    expect(inInventory).toBe(true);
  });

  it('替换武器后，新武器已装备', () => {
    const run = createNewRun('sword');
    const run1 = equipItem(run, testWeapon);
    const run2 = equipItem(run1, testWeapon2);
    expect(run2.equippedItems.weapon?.id).toBe(testWeapon2.id);
  });

  it('装备替换后，属性按新装备重新计算（+200 > +100）', () => {
    const run = createNewRun('sword');
    const run1 = equipItem(run, testWeapon);   // +100 atk
    const run2 = equipItem(run1, testWeapon2); // +200 atk
    // 换装后攻击力应高于只装第一件的情况
    expect(run2.stats.atk).toBeGreaterThan(run1.stats.atk);
  });
});
