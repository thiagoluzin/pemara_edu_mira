/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PEMARA TELA DE RESULTADO & EDITOR VISUAL (V1 COM VISUAL VALIDATOR)
 * Indicadores por slide:
 * - Status [READY] ou [NEEDS_REVIEW]
 * - Verificação da Safe Area, colisão e limites tipográficos 1920x1080
 * - Botão de Pré-visualização determinística com miniaturas
 */

import React, { useState } from 'react';
import { LessonSpec, Scene } from '../types/lesson';
import { PemaraRenderer } from '../renderer/PemaraRenderer';
import { PemaraMaestro } from '../maestro/pemaraMaestro';
import { VisualValidator, SlideValidationReport } from '../validator/visualValidator';
import {
  Play,
  Share2,
  Wand2,
  HelpCircle,
  Minimize2,
  PlusCircle,
  Trash2,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

interface Props {
  lesson: LessonSpec;
  onUpdateLesson: (updatedLesson: LessonSpec) => void;
  onStartPresentation: (startSceneIndex: number) => void;
  onOpenExportModal: () => void;
  onOpenMaestroLogs: () => void;
}

export const LessonEditor: React.FC<Props> = ({
  lesson,
  onUpdateLesson,
  onStartPresentation,
  onOpenExportModal,
  onOpenMaestroLogs
}) => {
  const [activeSceneIndex, setActiveSceneIndex] = useState<number>(0);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState<string>('');
  const [editFeedback, setEditFeedback] = useState<string | null>(null);
  const [isProcessingEdit, setIsProcessingEdit] = useState<boolean>(false);
  const [showValidationDrawer, setShowValidationDrawer] = useState<boolean>(false);

  const currentScene = lesson.scenes[activeSceneIndex];

  // Validação em tempo real do slide ativo
  const currentValidation: SlideValidationReport = VisualValidator.validateScene(
    currentScene,
    currentScene?.layout_id || '02_title_body'
  );

  // Validação geral de todos os slides da aula
  const allValidationReports = lesson.scenes.map((s) => ({
    scene: s,
    report: VisualValidator.validateScene(s, s.layout_id || '02_title_body')
  }));

  const hasFails = allValidationReports.some((r) => r.report.status === 'FAIL');
  const hasWarnings = allValidationReports.some((r) => r.report.status === 'WARNING');
  const overallVisualStatus = hasFails ? 'NEEDS_REVIEW' : 'READY';

  // Disparar Auto-Correction determinístico no slide atual
  const handleAutoCorrectCurrentSlide = () => {
    const layoutId = currentScene.layout_id || '02_title_body';
    const { correctedScene, newScenes } = VisualValidator.autoCorrectScene(currentScene, layoutId);

    const updatedScenes = [...lesson.scenes];
    updatedScenes[activeSceneIndex] = correctedScene;
    if (newScenes && newScenes.length > 0) {
      updatedScenes.splice(activeSceneIndex + 1, 0, ...newScenes);
    }

    const updated: LessonSpec = {
      ...lesson,
      scenes: updatedScenes,
      lesson_version: lesson.lesson_version + 1,
      lesson: {
        ...lesson.lesson,
        visual_status: 'READY'
      }
    };
    onUpdateLesson(updated);
    setEditFeedback('Auto-Correction executado com sucesso: espaçamentos e fontes reajustados para a Safe Area.');
  };

  // Ação Rápida: [ GERAR QUIZ ]
  const handleAddQuiz = () => {
    const newQuiz: Scene = {
      id: `sc-quiz-${Date.now()}`,
      type: 'quiz',
      layout_id: '10_quiz',
      title: 'Verificação Diagnóstica',
      question: `Com base nos conceitos de ${lesson.lesson.title}, qual é o comportamento esperado?`,
      answers: [
        'A grandeza se mantém constante e uniforme',
        'A taxa de variação depende diretamente das condições iniciais',
        'O sistema atinge o equilíbrio termodinâmico/mecânico',
        'O movimento cessa instantaneamente'
      ],
      correct_index: 1,
      explanation: 'Exato! As condições iniciais e os parâmetros físicos ditam a evolução temporal do sistema didático.'
    };
    const updated = {
      ...lesson,
      scenes: [...lesson.scenes, newQuiz],
      lesson_version: lesson.lesson_version + 1
    };
    onUpdateLesson(updated);
    setActiveSceneIndex(updated.scenes.length - 1);
    setEditFeedback('Novo quiz formativo adicionado ao final da aula com sucesso!');
  };

  // Ação Rápida: [ DEIXAR MAIS SIMPLES ]
  const handleMakeSimpler = () => {
    const { updatedLesson } = PemaraMaestro.editLessonByInstruction(
      lesson,
      'Deixe os textos mais simples e didáticos'
    );
    onUpdateLesson(updatedLesson);
    setEditFeedback('Conteúdo simplificado com sucesso para facilitar a compreensão dos alunos.');
  };

  // Ação Rápida: [ ADICIONAR EXEMPLOS ]
  const handleAddExamples = () => {
    const newTextScene: Scene = {
      id: `sc-example-${Date.now()}`,
      type: 'text',
      layout_id: '02_title_body',
      title: 'Aplicações no Mundo Real e Exemplos Cotidianos',
      content: [
        'Como esse conceito se manifesta no nosso dia a dia?',
        'Exemplo 1: No esporte e na vida cívica, as regras e estruturas são construídas para garantir clareza e previsibilidade.',
        'Exemplo 2: Na engenharia e nas instituições modernas, a experiência histórica fundamenta novas soluções.'
      ],
      callout: 'Dica para a aula: Peça para os alunos identificarem outros dois exemplos de suas rotinas!'
    };

    const updated = {
      ...lesson,
      scenes: [...lesson.scenes, newTextScene],
      lesson_version: lesson.lesson_version + 1
    };
    onUpdateLesson(updated);
    setActiveSceneIndex(updated.scenes.length - 1);
    setEditFeedback('Cena de exemplos práticos adicionada à aula!');
  };

  // Execução de Edição por Linguagem Natural
  const handleNaturalLanguageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalLanguageInput.trim()) return;

    setIsProcessingEdit(true);
    setEditFeedback(null);

    try {
      const { updatedLesson, affectedScenes } = PemaraMaestro.editLessonByInstruction(
        lesson,
        naturalLanguageInput
      );
      onUpdateLesson(updatedLesson);
      setEditFeedback(
        `Instrução aplicada! Versão ${updatedLesson.lesson_version} gerada. Cenas ajustadas: ${affectedScenes.length > 0 ? affectedScenes.join(', ') : 'Geral'}`
      );
      setNaturalLanguageInput('');
    } catch {
      setEditFeedback('Não foi possível interpretar a alteração solicitada.');
    } finally {
      setIsProcessingEdit(false);
    }
  };

  const handleUpdateCurrentScene = (updatedScene: Scene) => {
    const newScenes = [...lesson.scenes];
    newScenes[activeSceneIndex] = updatedScene;
    onUpdateLesson({
      ...lesson,
      scenes: newScenes,
      lesson_version: lesson.lesson_version + 1
    });
  };

  const handleDeleteCurrentScene = () => {
    if (lesson.scenes.length <= 1) return;
    const newScenes = lesson.scenes.filter((_, idx) => idx !== activeSceneIndex);
    const newIndex = Math.max(0, activeSceneIndex - 1);
    onUpdateLesson({
      ...lesson,
      scenes: newScenes,
      lesson_version: lesson.lesson_version + 1
    });
    setActiveSceneIndex(newIndex);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* BARRA SUPERIOR DE AÇÕES RÁPIDAS COM STATUS DO VISUAL VALIDATOR */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
              Aula Criada • Versão {lesson.lesson_version}
            </span>
            {/* Tag do Visual Status */}
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                overallVisualStatus === 'READY'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-950/70 border-rose-500/40 text-rose-400'
              }`}
            >
              {overallVisualStatus === 'READY' ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>STATUS: READY (1920x1080)</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3 h-3 text-rose-400" />
                  <span>STATUS: NEEDS REVIEW</span>
                </>
              )}
            </span>
          </div>

          <h2 className="text-2xl font-black text-white">{lesson.lesson.title}</h2>
          <span className="text-xs text-slate-400">
            {lesson.lesson.subject.toUpperCase()} • {lesson.lesson.grade} • {lesson.lesson.duration_minutes} min • {lesson.scenes.length} Cenas
          </span>
        </div>

        {/* BOTOES DE AÇÃO */}
        <div className="flex flex-wrap items-center gap-2">
          {/* [ APRESENTAR ] (Bloqueado se houver FAIL na Seção de Critério de Aceite) */}
          <button
            disabled={hasFails}
            onClick={() => onStartPresentation(activeSceneIndex)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all transform hover:scale-105 ${
              hasFails
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40'
            }`}
            title={hasFails ? 'Corrija os erros visuais antes de apresentar' : 'Apresentar em tela cheia'}
          >
            <Play className="w-4 h-4 fill-white" />
            <span>APRESENTAR</span>
          </button>

          {/* [ RELATÓRIO DO VISUAL VALIDATOR ] */}
          <button
            onClick={() => setShowValidationDrawer(!showValidationDrawer)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              showValidationDrawer
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Visual Validator</span>
          </button>

          {/* [ GERAR QUIZ ] */}
          <button
            onClick={handleAddQuiz}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <HelpCircle className="w-4 h-4 text-indigo-400" />
            <span>GERAR QUIZ</span>
          </button>

          {/* [ DEIXAR MAIS SIMPLES ] */}
          <button
            onClick={handleMakeSimpler}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Minimize2 className="w-4 h-4 text-cyan-400" />
            <span>DEIXAR MAIS SIMPLES</span>
          </button>

          {/* [ ADICIONAR EXEMPLOS ] */}
          <button
            onClick={handleAddExamples}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>ADICIONAR EXEMPLOS</span>
          </button>

          {/* [ EXPORTAR ] */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span>EXPORTAR</span>
          </button>

          {/* [ MAESTRO LOGS ] */}
          <button
            onClick={onOpenMaestroLogs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Ver Logs dos 5 Agentes do Maestro"
          >
            <Wand2 className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* PAINEL INFORMATIVO DO VISUAL VALIDATOR */}
      {showValidationDrawer && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-cyan-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-white">
                Auditoria de Qualidade Visual (1920x1080 Safe Area & No-Collision)
              </h3>
            </div>
            <button
              onClick={() => setShowValidationDrawer(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-xs block">Resolução de Referência</span>
              <span className="font-mono text-sm font-bold text-white">1920 x 1080 px</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-xs block">Safe Area Bounds</span>
              <span className="font-mono text-sm font-bold text-emerald-400">
                L:100 R:100 T:80 B:80
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 text-xs block">Status do Slide Atual</span>
              <span
                className={`font-mono text-sm font-bold ${
                  currentValidation.status === 'PASS'
                    ? 'text-emerald-400'
                    : currentValidation.status === 'WARNING'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {currentValidation.status} ({currentScene.layout_id || '02_title_body'})
              </span>
            </div>
          </div>

          {currentValidation.issues.length > 0 ? (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">Apontamentos do Validador:</span>
              {currentValidation.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    issue.severity === 'FAIL'
                      ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {issue.severity === 'FAIL' ? (
                      <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    )}
                    <span>{issue.message}</span>
                  </div>

                  <button
                    onClick={handleAutoCorrectCurrentSlide}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-[11px] flex items-center gap-1 border border-slate-600 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Auto-Corrigir</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Nenhum overflow, colisão ou violação de margem detectado neste slide.</span>
            </div>
          )}
        </div>
      )}

      {/* FEEDBACK DE EDIÇÃO */}
      {editFeedback && (
        <div className="p-3.5 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-xs text-indigo-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{editFeedback}</span>
          </div>
          <button onClick={() => setEditFeedback(null)} className="text-slate-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* ÁREA PRINCIPAL: MINIATURAS À ESQUERDA & PREVIEW AO VIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUNA ESQUERDA: MINIATURAS DAS CENAS */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Roteiro de Cenas ({lesson.scenes.length})
            </span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1 scrollbar-thin">
            {lesson.scenes.map((scene, index) => {
              const isActive = activeSceneIndex === index;
              const valReport = VisualValidator.validateScene(scene, scene.layout_id || '02_title_body');

              return (
                <div
                  key={scene.id}
                  onClick={() => setActiveSceneIndex(index)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col gap-1.5 ${
                    isActive
                      ? 'bg-indigo-950/70 border-indigo-500 ring-2 ring-indigo-500/40 shadow-lg'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-indigo-400 flex items-center gap-1.5">
                      <span>Slide {index + 1}</span>
                      {valReport.status === 'PASS' && (
                        <span title="Validado (PASS)"><CheckCircle2 className="w-3 h-3 text-emerald-400" /></span>
                      )}
                      {valReport.status === 'WARNING' && (
                        <span title="Atenção (WARNING)"><AlertTriangle className="w-3 h-3 text-amber-400" /></span>
                      )}
                      {valReport.status === 'FAIL' && (
                        <span title="Falha (FAIL)"><XCircle className="w-3 h-3 text-rose-400" /></span>
                      )}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 uppercase font-semibold text-slate-300">
                      {scene.type.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate">{scene.title}</h4>
                </div>
              );
            })}
          </div>

          {/* Botão de Excluir Cena Atual */}
          {lesson.scenes.length > 1 && (
            <button
              onClick={handleDeleteCurrentScene}
              className="w-full py-2 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remover Slide Atual</span>
            </button>
          )}
        </div>

        {/* COLUNA DIREITA: RENDERIZADOR AO VIVO & AJUSTES */}
        <div className="lg:col-span-9 space-y-6">
          <div className="relative">
            <PemaraRenderer
              scene={currentScene}
              onSceneParamChange={handleUpdateCurrentScene}
            />
          </div>

          {/* EDIÇÃO POR LINGUAGEM NATURAL */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Edição por Linguagem Natural (POST /lessons/:id/edit)
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Instrua o Maestro como se estivesse conversando com um assistente pedagógico. Ex: "Adicione um quiz", "Deixe mais simples", "Altere os parâmetros da simulação".
            </p>

            <form onSubmit={handleNaturalLanguageSubmit} className="flex gap-2">
              <input
                type="text"
                value={naturalLanguageInput}
                onChange={(e) => setNaturalLanguageInput(e.target.value)}
                placeholder="Ex: O texto do slide 4 está muito longo. Divida ou resuma..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={isProcessingEdit || !naturalLanguageInput.trim()}
                className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Aplicar</span>
              </button>
            </form>
          </div>

          {/* NOTAS DO PROFESSOR */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
            <span className="font-semibold text-slate-300 block">
              Notas Pedagógicas do Slide {activeSceneIndex + 1} (Visíveis apenas para o professor durante a apresentação):
            </span>
            <textarea
              rows={2}
              value={currentScene?.teacher_notes || ''}
              onChange={(e) => {
                handleUpdateCurrentScene({
                  ...currentScene,
                  teacher_notes: e.target.value
                });
              }}
              placeholder="Digite orientações de mediação ou perguntas provocativas para a turma..."
              className="w-full p-3 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
