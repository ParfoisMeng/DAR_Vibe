// ─── 功法树 + 协同 UI ──────────────────────────────────────────────
// 职责：渲染右侧的功法树节点列表和协同感应列表

import { SkillNode, Synergy, SynergyTier } from '../types';
import { SYNERGIES_PHASE0 } from '../data/synergies';

/** 渲染右侧已习得功法列表 */
export function renderSkillTree(nodes: SkillNode[]): void {
  const el = document.getElementById('skill-tree-display');
  if (!el) return;

  if (nodes.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text2)">尚未修炼任何功法</div>';
    return;
  }

  el.innerHTML = nodes.map(n => `
    <div class="skill-node">
      <div class="sk-name">${n.name}</div>
      <div class="sk-type">${n.spiritRoot === 'universal' ? '通用' : n.spiritRoot + '灵根'}
        ${n.synergyTags.length ? '· ' + n.synergyTags.join(' ') : ''}</div>
      ${n.synergyTags.length ? `<div class="sk-syn">相关协同标签：${n.synergyTags.length}个</div>` : ''}
    </div>
  `).join('');
}

/** 渲染已触发的协同效果 */
export function renderSynergies(synergies: Synergy[]): void {
  const el = document.getElementById('synergy-display');
  if (!el) return;

  if (synergies.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text2)">天机沉寂，尚无感应</div>';
    return;
  }

  const tierColor: Record<SynergyTier, string> = {
    commonA: 'purple', commonB: 'purple', rare: 'orange', epic: 'gold',
  };
  el.innerHTML = synergies.map(s => `
    <div class="synergy-item ${s.tier === 'rare' ? 'rare' : s.tier === 'epic' ? 'epic' : ''}">
      <div style="color:var(--${tierColor[s.tier]});font-size:12px;font-weight:bold">${s.name}</div>
      <div style="font-size:11px;color:var(--text2);margin-top:2px">${s.logText}</div>
    </div>
  `).join('');
}

/** 弹出协同发现 Toast（3 秒自动消失） */
export function showSynergyToast(synergy: Synergy): void {
  const el = document.getElementById('synergy-toast')!;
  el.textContent = `天机感应：${synergy.name} — ${synergy.logText}`;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3000);
}

/** 渲染天机图鉴（显示所有协同槽位，未发现的显示「???」） */
export function renderJournal(discoveredIds: string[]): void {
  const el = document.getElementById('journal-display');
  if (!el) return;

  el.innerHTML = SYNERGIES_PHASE0.map(s => {
    const found = discoveredIds.includes(s.id);
    if (found) {
      return `<div style="font-size:11px;color:var(--text2);margin-bottom:3px">· ${s.name}</div>`;
    } else {
      return `<div style="font-size:11px;color:#444;margin-bottom:3px">· ???</div>`;
    }
  }).join('') + `<div style="font-size:10px;color:#555;margin-top:4px">已发现 ${discoveredIds.length}/${SYNERGIES_PHASE0.length}</div>`;
}
