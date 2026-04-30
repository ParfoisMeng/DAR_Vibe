// ============================================================
//  单元测试：存档系统 save.ts
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadMeta, saveMeta, loadRunSnapshot, saveRunSnapshot,
         clearRunSnapshot, exportSaveCode, importSaveCode, clearAllData } from '../../src/save';
import { defaultMeta } from '../../src/types';

// ── jsdom 内置 localStorage，直接使用
// 每个测试前清空 localStorage ─────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

// ── 1. Meta 读写 ──────────────────────────────────────────────

describe('Meta 存档：读写', () => {
  it('空存档时，loadMeta 返回 defaultMeta', () => {
    const meta = loadMeta();
    const def = defaultMeta();
    expect(meta.totalRuns).toBe(def.totalRuns);
    expect(meta.discoveredSynergies).toEqual(def.discoveredSynergies);
  });

  it('saveMeta + loadMeta 往返正确', () => {
    const meta = defaultMeta();
    meta.totalRuns = 5;
    meta.discoveredSynergies = ['syn_001', 'syn_002'];
    saveMeta(meta);
    const loaded = loadMeta();
    expect(loaded.totalRuns).toBe(5);
    expect(loaded.discoveredSynergies).toEqual(['syn_001', 'syn_002']);
  });
});

// ── 2. RunSnapshot 读写 ───────────────────────────────────────

describe('RunSnapshot：快照读写', () => {
  it('无快照时，loadRunSnapshot 返回 null', () => {
    expect(loadRunSnapshot()).toBeNull();
  });

  it('saveRunSnapshot 后，loadRunSnapshot 返回相同数据', () => {
    const snap = {
      runId: 'test_run_001',
      spiritRoot: 'sword' as const,
      currentZone: 1,
      currentNodeIndex: 3,
      phase: 'zoneStart' as const,
      stats: {
        hp: 2500, maxHp: 2500, shield: 0, atk: 550, atkSpeed: 1.2,
        critRate: 0.15, critDmg: 1.5, dmgReduce: 0, dodge: 0,
        luckDrop: 0, fateDest: 0, swordIntent: 30,
      },
      equippedItems: {},
      inventory: [],
      skillTree: [],
      activeSynergies: [],
      materials: 0,
      daoYun: 10,
      heavenlyMomentHistory: [],
      combatCount: 4,
      synergyTriggerCount: 0,
    };
    saveRunSnapshot(snap);
    const loaded = loadRunSnapshot();
    expect(loaded).not.toBeNull();
    expect(loaded!.runId).toBe('test_run_001');
    expect(loaded!.currentZone).toBe(1);
    expect(loaded!.daoYun).toBe(10);
  });

  it('clearRunSnapshot 后，loadRunSnapshot 返回 null', () => {
    const snap = { runId: 'x' } as any;
    saveRunSnapshot(snap);
    clearRunSnapshot();
    expect(loadRunSnapshot()).toBeNull();
  });
});

// ── 3. 存档码导出/导入 ────────────────────────────────────────

describe('存档码：导出与导入往返', () => {
  it('exportSaveCode 返回非空字符串', () => {
    const code = exportSaveCode();
    expect(typeof code).toBe('string');
    expect(code.length).toBeGreaterThan(0);
  });

  it('导出后导入，meta.totalRuns 还原正确', () => {
    const meta = defaultMeta();
    meta.totalRuns = 7;
    meta.discoveredSynergies = ['syn_test'];
    saveMeta(meta);

    const code = exportSaveCode();

    // 清除当前存档，再导入
    localStorage.clear();
    const result = importSaveCode(code);
    expect(result.success).toBe(true);

    const loaded = loadMeta();
    expect(loaded.totalRuns).toBe(7);
    expect(loaded.discoveredSynergies).toContain('syn_test');
  });

  it('无效存档码导入返回 success:false', () => {
    const result = importSaveCode('这不是有效的存档码!!!');
    expect(result.success).toBe(false);
  });

  it('空字符串导入返回 success:false', () => {
    const result = importSaveCode('');
    expect(result.success).toBe(false);
  });
});

// ── 4. clearAllData ───────────────────────────────────────────

describe('clearAllData：清空存档', () => {
  it('清档后 loadMeta 返回 defaultMeta', () => {
    const meta = defaultMeta();
    meta.totalRuns = 99;
    saveMeta(meta);
    clearAllData();
    const loaded = loadMeta();
    expect(loaded.totalRuns).toBe(defaultMeta().totalRuns);
  });

  it('清档后 loadRunSnapshot 返回 null', () => {
    saveRunSnapshot({ runId: 'x' } as any);
    clearAllData();
    expect(loadRunSnapshot()).toBeNull();
  });
});
