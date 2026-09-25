/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PEMARA FORMULÁRIO DE CRIAÇÃO DO PROFESSOR (V1 DETERMINÍSTICO)
 * Foco em EF Anos Finais (6º a 9º ano): História, Geografia, Ciências e Matemática
 * Conexão direta com Knowledge Core e Content Packs determinísticos
 */

import React, { useState } from 'react';
import { Subject, GenerationMode } from '../types/lesson';
import { GenerationInput } from '../maestro/pemaraMaestro';
import {
  Sparkles,
  Upload,
  Cpu,
  Server,
  Layers,
  CheckCircle2,
  FileText,
  Clock,
  GraduationCap,
  BookOpen,
  Database
} from 'lucide-react';

interface Props {
  onCreateLesson: (input: GenerationInput) => Promise<void>;
  isGenerating: boolean;
}

export const LessonCreator: React.FC<Props> = ({ onCreateLesson, isGenerating }) => {
  const [subject, setSubject] = useState<Subject>('history');
  const [grade, setGrade] = useState<string>('6EF');
  const [topic, setTopic] = useState<string>('Grécia Antiga: Pólis, Democracia e Sociedade');
  const [duration, setDuration] = useState<number>(45);
  const [didacticStyle, setDidacticStyle] = useState<'visual' | 'summary' | 'review' | 'exercises' | 'complete'>('visual');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('MODE_A_NO_AI');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [materialText, setMaterialText] = useState<string>('');

  // Sugestões curriculares alinhadas com o escopo do PEMARA EDU CORE V1
  const topicSuggestions: Record<Subject, string[]> = {
    history: [
      'Grécia Antiga: Pólis, Democracia e Sociedade (Content Pack 6º Ano)',
      'Roma Antiga: Da República ao Império',
      'Feudalismo e a Idade Média',
      'A Revolução Industrial: Máquinas e Sociedade'
    ],
    science: [
      'O Sistema Solar e os Movimentos da Terra (6º Ano)',
      'A Estrutura da Célula Animal e Vegetal',
      'Fases da Lua e Eclipses',
      'Ciclo da Água e Efeito Estufa'
    ],
    physics: [
      'Lançamento Oblíquo: Trajetória e Vetores (Física Determinística)',
      'Queda Livre e Aceleração da Gravidade',
      'Movimento Circular e Força Centrípeta',
      'Leis de Newton e Diagrama de Forças'
    ],
    math: [
      'Função Quadrática e a Parábola: y = ax² + bx + c (9º Ano)',
      'Trigonometria no Triângulo Retângulo',
      'Geometria Espacial: Prismas e Cilindros',
      'Estatística: Média, Mediana e Desvio Padrão'
    ],
    geography: [
      'Península Balcânica e o Relevo Europeu',
      'Placas Tectônicas e Abalos Sísmicos',
      'Climas do Brasil e Biomas'
    ],
    biology: [
      'Estrutura do DNA e Síntese de Proteínas',
      'Genética Mendeliana e Hereditariedade'
    ],
    chemistry: [
      'Tabela Periódica e Ligações Químicas',
      'Estequiometria e Leis Ponderais'
    ]
  };

  // Simulação de leitura de material temporário do professor/escola (Regra 3: nunca treina modelo e é descartado)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = (event.target?.result as string) || '';
        setMaterialText(text.slice(0, 3000));
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    onCreateLesson({
      subject,
      grade,
      topic,
      duration_minutes: duration,
      didactic_style: didacticStyle,
      material_text: materialText,
      generation_mode: generationMode
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100">
      <div className="border-b border-slate-800 pb-5 mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          PEMARA EDU CORE v1 — Estúdio Determinístico do Professor
        </div>
        <h2 className="text-3xl font-black text-white tracking-tight">Criar Nova Aula Curricular</h2>
        <p className="text-slate-400 text-sm mt-1">
          Foco nos Anos Finais do Ensino Fundamental (6º a 9º ano). Geração determinística baseada no Knowledge Core e Content Packs auditados.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* LINHA 1: DISCIPLINA, SÉRIE E DURAÇÃO */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Disciplina */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Disciplina (EF Finais)
            </label>
            <select
              value={subject}
              onChange={(e) => {
                const s = e.target.value as Subject;
                setSubject(s);
                if (topicSuggestions[s] && topicSuggestions[s][0]) {
                  setTopic(topicSuggestions[s][0]);
                }
              }}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="history">História (Content Pack Grécia 6º Ano)</option>
              <option value="science">Ciências (Sistema Solar 6º Ano)</option>
              <option value="physics">Física (Cinemática Vetorial)</option>
              <option value="math">Matemática (Funções e Álgebra)</option>
              <option value="geography">Geografia</option>
              <option value="biology">Biologia</option>
              <option value="chemistry">Química</option>
            </select>
          </div>

          {/* Série / Ano */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
              Ano Escolar (BNCC)
            </label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="6EF">6º Ano (Ensino Fundamental)</option>
              <option value="7EF">7º Ano (Ensino Fundamental)</option>
              <option value="8EF">8º Ano (Ensino Fundamental)</option>
              <option value="9EF">9º Ano (Ensino Fundamental)</option>
              <option value="1EM">1º Ano (Ensino Médio)</option>
              <option value="2EM">2º Ano (Ensino Médio)</option>
              <option value="3EM">3º Ano (Ensino Médio)</option>
            </select>
          </div>

          {/* Duração */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Duração Estimada
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={15}>15 minutos (Pílula Rápida)</option>
              <option value={30}>30 minutos (Conceito + Fixação)</option>
              <option value={45}>45 minutos (Aula Padrão)</option>
              <option value={60}>60 minutos (Aula Completa)</option>
            </select>
          </div>
        </div>

        {/* TEMA DA AULA */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Tema ou Objeto de Conhecimento
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Grécia Antiga, Sistema Solar, Lançamento Oblíquo..."
            className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
            required
          />

          {/* Sugestões de 1 clique */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-slate-400 self-center">Content Packs e Sugestões:</span>
            {topicSuggestions[subject]?.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setTopic(sug)}
                className="text-xs px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>

        {/* ESTILO DIDÁTICO */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Método Pedagógico (Camada Independente do Conhecimento)
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { id: 'visual', label: 'Visual & Simulação', desc: 'Foco em mapas e modelos' },
              { id: 'summary', label: 'Resumo Sintético', desc: 'Conceitos em tópicos diretos' },
              { id: 'review', label: 'Revisão de Prova', desc: 'Pontos-chave e fórmulas' },
              { id: 'exercises', label: 'Exercícios & Quiz', desc: 'Foco em resolução de questões' },
              { id: 'complete', label: 'Aula Completa', desc: 'Teoria, mapa, comparação e quiz' }
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setDidacticStyle(st.id as any)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  didacticStyle === st.id
                    ? 'bg-indigo-950/80 border-indigo-500 ring-2 ring-indigo-500/30 text-white'
                    : 'bg-slate-800/50 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{st.label}</span>
                  {didacticStyle === st.id && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-2">{st.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* MATERIAL TEMPORÁRIO DO PROFESSOR (Regra Congelada 3) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Material Temporário do Professor / Escola (Opcional)
          </label>
          <div className="border-2 border-dashed border-slate-700 hover:border-slate-500 rounded-2xl p-5 text-center transition-colors bg-slate-950/30">
            <input
              type="file"
              id="file-upload"
              accept=".pdf,.docx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <Upload className="w-7 h-7 text-indigo-400" />
              {attachedFileName ? (
                <div className="flex items-center gap-2 text-sm text-emerald-400 font-semibold">
                  <FileText className="w-4 h-4" />
                  <span>Arquivo anexado: {attachedFileName}</span>
                </div>
              ) : (
                <>
                  <span className="text-sm font-semibold text-slate-200">
                    Anexar plano de aula ou documento da escola
                  </span>
                  <span className="text-xs text-slate-400">
                    🔒 Regra de Privacidade V1: Material temporário não entra no Knowledge Core permanente, não é redistribuído e é descartado após a sessão.
                  </span>
                </>
              )}
            </label>
          </div>
        </div>

        {/* MODOS DE OPERAÇÃO */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Motor de Geração
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                id: 'MODE_A_NO_AI',
                icon: Layers,
                name: 'Modo A — Sem IA',
                badge: '100% Determinístico V1',
                badgeColor: 'text-emerald-400 bg-emerald-950/70 border-emerald-500/40',
                desc: 'Knowledge Core e Content Packs auditados. Instantâneo, offline, zero custos.'
              },
              {
                id: 'MODE_B_LOCAL_AI',
                icon: Cpu,
                name: 'Modo B — IA Local',
                badge: 'Heurístico Estruturado',
                badgeColor: 'text-cyan-400 bg-cyan-950/70 border-cyan-500/40',
                desc: 'Síntese algorítmica local baseada na Taxonomia de Bloom.'
              },
              {
                id: 'MODE_C_API',
                icon: Server,
                name: 'Modo C — API',
                badge: 'Gemini Cloud Proxy',
                badgeColor: 'text-indigo-400 bg-indigo-950/70 border-indigo-500/40',
                desc: 'Conexão via server proxy seguro com fallback determinístico automático.'
              },
              {
                id: 'MODE_D_AGENTS',
                icon: Sparkles,
                name: 'Modo D — Agentes',
                badge: 'Pemara Maestro',
                badgeColor: 'text-amber-400 bg-amber-950/70 border-amber-500/40',
                desc: 'Pipeline dos 5 agentes (Planner, Pedagogy, Visual, Fact Check, QA).'
              }
            ].map((mode) => {
              const Icon = mode.icon;
              const isSelected = generationMode === mode.id;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setGenerationMode(mode.id as any)}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${mode.badgeColor}`}>
                        {mode.badge}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-sm">{mode.name}</h4>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">{mode.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-xs text-indigo-300 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Modo Ativo</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SUBMISSÃO */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>O Lesson Composer está gerando a aula...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>GERAR AULA DETERMINÍSTICA</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
