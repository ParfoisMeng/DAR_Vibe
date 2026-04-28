// ─── 掉落决策 UI ────────────────────────────────────────────────────
// 职责：展示新装备属性并提示与现有装备对比

import { Equipment } from '../types';

let _pendingEquip: Equipment | null = null;
let _onEquip: ((e: Equipment) => void) | null = null;
let _onStore: ((e: Equipment) => void) | null = null;
let _onDiscard: (() => void) | null = null;

export function showLoot(
  newItem: Equipment,
  currentItem: Equipment | null,
  onEquip: (e: Equipment) => void,
  onStore: (e: Equipment) => void,
  onDiscard: () => void,
): void {
  _pendingEquip = newItem;
  _onEquip = onEquip;
  _onStore = onStore;
  _onDiscard = onDiscard;

  const qualityNames: Record<string, string> = {
    spirit: '灵器', rare: '罕见', supreme: '极品', immortal: '仙器',
  };
  const qEl = document.getElementById('loot-quality')!;
  qEl.className = `loot-quality ${newItem.quality}`;
  qEl.textContent = qualityNames[newItem.quality] ?? newItem.quality;

  document.getElementById('loot-name')!.textContent = `${newItem.slot} · ${newItem.name}`;

  const affEl = document.getElementById('loot-affixes')!;
  affEl.innerHTML = newItem.affixes.map(a =>
    `<div class="loot-affix">· ${a.description}</div>`
  ).join('') || '<div class="loot-affix" style="color:var(--text2)">（无词缀）</div>';

  const cmpEl = document.getElementById('loot-compare')!;
  if (currentItem) {
    cmpEl.innerHTML = `已装备：<b>${currentItem.name}</b><br/>`
      + currentItem.affixes.map(a => `<span>· ${a.description}</span>`).join('<br/>');
  } else {
    cmpEl.textContent = '（当前槽位为空）';
  }

  document.getElementById('loot-panel')!.classList.add('active');
}

export function hideLoot(): void {
  document.getElementById('loot-panel')!.classList.remove('active');
}

// 这三个函数由 index.html 内联 onclick 调用，挂在全局 Game 对象上
export function equipLoot(): void {
  if (_pendingEquip && _onEquip) { _onEquip(_pendingEquip); }
  hideLoot();
  _pendingEquip = null;
}
export function storeLoot(): void {
  if (_pendingEquip && _onStore) { _onStore(_pendingEquip); }
  hideLoot();
  _pendingEquip = null;
}
export function discardLoot(): void {
  if (_onDiscard) _onDiscard();
  hideLoot();
  _pendingEquip = null;
}
