// ─── 状态面板 UI ────────────────────────────────────────────────────
// 职责：把 RunState.playerStats 映射到左侧面板的各个 DOM 元素

import { Stats, Equipment } from '../types';

export function renderStats(stats: Stats, zone: string, combats: number, daoYun: number): void {
  const hp = Math.max(0, Math.round(stats.hp));
  const maxHp = Math.round(stats.maxHp);
  const shield = Math.round(stats.shield);
  const si = Math.min(100, Math.round(stats.swordIntent));

  // HP 条
  set('stat-hp', `${hp} / ${maxHp}`);
  setWidth('bar-hp', hp / maxHp * 100);

  // 护盾条
  set('stat-shield', `${shield}`);
  setWidth('bar-shield', shield > 0 ? Math.min(100, shield / maxHp * 100) : 0);

  // 剑意条
  set('stat-si', `${si} / 100`);
  setWidth('bar-si', si);

  // 数字属性
  set('stat-atk', `${Math.round(stats.atk)}`);
  set('stat-speed', `${stats.atkSpeed.toFixed(1)}/s`);
  set('stat-crit', `${(stats.critRate * 100).toFixed(0)}%`);
  set('stat-reduce', `${(stats.dmgReduce * 100).toFixed(0)}%`);
  set('stat-luck', `${(stats.luckDrop * 100).toFixed(0)}%`);

  // 行程
  set('stat-zone', zone || '—');
  set('stat-combats', `${combats}`);
  set('stat-daoyun', `${daoYun}`);
}

/** 渲染已装备的法宝格（weapon/armor/ring） */
export function renderEquipSlot(slotId: 'eq-weapon' | 'eq-armor' | 'eq-ring', item: Equipment | null | undefined): void {
  const el = document.getElementById(slotId);
  if (!el) return;

  if (!item) {
    el.className = 'equip-item equip-empty';
    el.innerHTML = '— 空 —';
    return;
  }

  el.className = `equip-item ${item.quality}`;
  el.innerHTML = `<div class="equip-name">${item.name}</div>`
    + item.affixes.map(a => `<div class="equip-affix">${a.description}</div>`).join('');
}

function set(id: string, text: string) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function setWidth(id: string, pct: number) {
  const el = document.getElementById(id) as HTMLElement | null;
  if (el) el.style.width = `${Math.max(0, Math.min(100, pct))}%`;
}
