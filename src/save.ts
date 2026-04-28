// ============================================================
//  存档系统（Day 11）
//  localStorage + 导出存档码（Base64）
// ============================================================

import type { MetaData, RunState } from './types';
import { defaultMeta } from './types';

const KEY_META = 'dar_vibe_meta';
const KEY_RUN = 'dar_vibe_run_snapshot';
const SAVE_VERSION = 1;

interface SaveFile {
  version: number;
  meta: MetaData;
  runSnapshot?: RunState;
  savedAt: string;
}

// ── localStorage 读写 ─────────────────────────────────────────

export function loadMeta(): MetaData {
  try {
    const raw = localStorage.getItem(KEY_META);
    if (!raw) return defaultMeta();
    const parsed = JSON.parse(raw) as MetaData;
    return { ...defaultMeta(), ...parsed };
  } catch {
    return defaultMeta();
  }
}

export function saveMeta(meta: MetaData): void {
  localStorage.setItem(KEY_META, JSON.stringify(meta));
}

export function loadRunSnapshot(): RunState | null {
  try {
    const raw = localStorage.getItem(KEY_RUN);
    if (!raw) return null;
    return JSON.parse(raw) as RunState;
  } catch {
    return null;
  }
}

export function saveRunSnapshot(run: RunState): void {
  localStorage.setItem(KEY_RUN, JSON.stringify(run));
}

export function clearRunSnapshot(): void {
  localStorage.removeItem(KEY_RUN);
}

// ── 导出存档码（Base64 编码）──────────────────────────────────

export function exportSaveCode(): string {
  const meta = loadMeta();
  const runSnapshot = loadRunSnapshot();
  const saveFile: SaveFile = {
    version: SAVE_VERSION,
    meta,
    runSnapshot: runSnapshot ?? undefined,
    savedAt: new Date().toISOString(),
  };
  const json = JSON.stringify(saveFile);
  // btoa 处理 UTF-8（需要先 encodeURIComponent）
  return btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16))
  ));
}

// ── 导入存档码 ────────────────────────────────────────────────

export function importSaveCode(code: string): { success: boolean; error?: string } {
  try {
    const json = decodeURIComponent(
      Array.from(atob(code))
        .map(c => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    const saveFile = JSON.parse(json) as SaveFile;
    if (saveFile.version !== SAVE_VERSION) {
      return { success: false, error: `存档版本不兼容（当前版本 ${SAVE_VERSION}，存档版本 ${saveFile.version}）` };
    }
    saveMeta(saveFile.meta);
    if (saveFile.runSnapshot) {
      saveRunSnapshot(saveFile.runSnapshot);
    } else {
      clearRunSnapshot();
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: '存档码无效或已损坏' };
  }
}

// ── 清档 ──────────────────────────────────────────────────────

export function clearAllData(): void {
  localStorage.removeItem(KEY_META);
  localStorage.removeItem(KEY_RUN);
}

// ── Run 结束：将本局数据合并到永久存档 ───────────────────────

export function finalizeRun(
  run: RunState,
  victory: boolean,
): void {
  const meta = loadMeta();
  meta.totalRuns += 1;
  const earned = victory ? Math.round(run.daoYun * 1.2) : run.daoYun;
  meta.totalDaoYun += earned;

  // 将本局装备全部存入仓库（死亡不消失）
  const allEquips = [
    ...Object.values(run.equippedItems).filter(Boolean),
    ...run.inventory,
  ] as import('./types').Equipment[];

  const newWarehouse = [...meta.warehouse, ...allEquips];
  // 仓库上限20件，超出丢弃最旧的
  meta.warehouse = newWarehouse.slice(-20);

  saveMeta(meta);
  clearRunSnapshot();
}
