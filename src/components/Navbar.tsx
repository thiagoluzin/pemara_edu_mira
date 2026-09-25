/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, Layers, BookOpen, User, Play, PlusCircle, Database } from 'lucide-react';
import { GenerationMode } from '../types/lesson';

interface Props {
  activeTab: 'editor' | 'create' | 'library' | 'knowledge';
  onTabChange: (tab: 'editor' | 'create' | 'library' | 'knowledge') => void;
  activeMode: GenerationMode;
  onStartPresentation: () => void;
  canPresent: boolean;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  onTabChange,
  activeMode,
  onStartPresentation,
  canPresent
}) => {
  const modeLabels: Record<GenerationMode, { label: string; color: string }> = {
    MODE_A_NO_AI: { label: 'Modo A • Sem IA (Determinístico)', color: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/40' },
    MODE_B_LOCAL_AI: { label: 'Modo B • IA Local', color: 'text-cyan-400 bg-cyan-950/70 border-cyan-500/40' },
    MODE_C_API: { label: 'Modo C • API Gemini', color: 'text-indigo-400 bg-indigo-950/70 border-indigo-500/40' },
    MODE_D_AGENTS: { label: 'Modo D • Agentes Maestro', color: 'text-amber-400 bg-amber-950/70 border-amber-500/40' }
  };

  const currentModeBadge = modeLabels[activeMode] || modeLabels.MODE_A_NO_AI;

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onTabChange('editor')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                PEMARA <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">AULA</span>
              </span>
              <span className="text-[10px] text-slate-400 block -mt-1 font-medium">
                Motor Gerador de Aulas Visuais
              </span>
            </div>
          </div>

          {/* Active Generation Mode Pill */}
          <span className={`hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${currentModeBadge.color}`}>
            {currentModeBadge.label}
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
          <button
            onClick={() => onTabChange('editor')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'editor'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Estúdio & Visualizador
          </button>
          <button
            onClick={() => onTabChange('create')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'create'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Nova Aula</span>
          </button>
          <button
            onClick={() => onTabChange('library')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'library'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Minhas Aulas</span>
          </button>
          <button
            onClick={() => onTabChange('knowledge')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'knowledge'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Knowledge Studio</span>
          </button>
        </nav>

        {/* Right Action: Present & Profile */}
        <div className="flex items-center gap-3">
          {canPresent && (
            <button
              onClick={onStartPresentation}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/50 transition-all transform hover:scale-105"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>APRESENTAR</span>
            </button>
          )}

          <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
            <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-bold">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="hidden md:inline font-medium text-slate-300">Prof. Thiago Luzin</span>
          </div>
        </div>
      </div>
    </header>
  );
};
