/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PEMARA AULA — APLICAÇÃO PRINCIPAL (APP.TSX)
 * Arquitetura completa do motor gerador de aulas visuais:
 * - Núcleo determinístico sem IA (Knowledge Core + Content Packs)
 * - Provas obrigatórias: Grécia Antiga (6EF), Sistema Solar (6EF), Lançamento Oblíquo (Física)
 * - Layout Engine com Zonas Fixas e Safe Areas
 * - Visual Validator com detecção de colisão analítica
 */

import React, { useState, useEffect } from 'react';
import { LessonSpec, Scene, GenerationMode } from './types/lesson';
import {
  TEMPLATE_GREECE_6EF,
  TEMPLATE_PROJECTILE_MOTION,
  TEMPLATE_SOLAR_SYSTEM,
  TEMPLATE_MATH_FUNCTION
} from './templates/deterministicTemplates';
import { PemaraMaestro, GenerationInput } from './maestro/pemaraMaestro';
import { Navbar } from './components/Navbar';
import { LessonEditor } from './components/LessonEditor';
import { LessonCreator } from './components/LessonCreator';
import { SavedLessonsList } from './components/SavedLessonsList';
import { PresentationMode } from './components/PresentationMode';
import { ExportModal } from './components/ExportModal';
import { MaestroLogViewer } from './components/MaestroLogViewer';
import { KnowledgeStudio } from './knowledge/studio/KnowledgeStudio';

const LOCAL_STORAGE_KEY = 'pemara_saved_lessons_v2';

export default function App() {
  // Inicialização da biblioteca de aulas com as provas canônicas do PEMARA EDU CORE V1
  const [savedLessons, setSavedLessons] = useState<LessonSpec[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignora erro
    }
    return [
      TEMPLATE_GREECE_6EF,          // Prova Obrigatória 1: História 6º ano — Grécia Antiga
      TEMPLATE_SOLAR_SYSTEM,         // Prova Obrigatória 2: Ciências 6º ano — Sistema Solar
      TEMPLATE_PROJECTILE_MOTION,    // Prova Obrigatória 3: Física — Lançamento Oblíquo
      TEMPLATE_MATH_FUNCTION         // Prova Complementar: Matemática — Função Quadrática
    ];
  });

  // Aula Ativa selecionada no Estúdio
  const [currentLesson, setCurrentLesson] = useState<LessonSpec>(savedLessons[0] || TEMPLATE_GREECE_6EF);

  // Navegação de Abas: 'editor' | 'create' | 'library' | 'knowledge'
  const [activeTab, setActiveTab] = useState<'editor' | 'create' | 'library' | 'knowledge'>('editor');

  // Estados de Modais
  const [isPresentationOpen, setIsPresentationOpen] = useState<boolean>(false);
  const [presentationStartScene, setPresentationStartScene] = useState<number>(0);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isMaestroLogsOpen, setIsMaestroLogsOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Persistência em LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(savedLessons));
    } catch {
      // Storage indisponível
    }
  }, [savedLessons]);

  // Atualizar a aula atual e sincronizar na lista de salvas
  const handleUpdateCurrentLesson = (updatedLesson: LessonSpec) => {
    setCurrentLesson(updatedLesson);
    setSavedLessons((prev) =>
      prev.map((item) => (item.lesson.id === updatedLesson.lesson.id ? updatedLesson : item))
    );
  };

  // Criar Nova Aula através do Maestro / Lesson Composer
  const handleCreateLesson = async (input: GenerationInput) => {
    setIsGenerating(true);
    try {
      const { lesson } = await PemaraMaestro.generateLesson(input);
      setSavedLessons((prev) => [lesson, ...prev]);
      setCurrentLesson(lesson);
      setActiveTab('editor');
    } catch (err) {
      console.error('Erro na geração da aula:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Duplicar Aula
  const handleDuplicateLesson = (lesson: LessonSpec) => {
    const duplicated: LessonSpec = {
      ...JSON.parse(JSON.stringify(lesson)),
      schema_version: '1.0',
      lesson_version: 1,
      lesson: {
        ...lesson.lesson,
        id: `pemara-copy-${Date.now()}`,
        title: `${lesson.lesson.title} (Cópia)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    setSavedLessons((prev) => [duplicated, ...prev]);
    setCurrentLesson(duplicated);
    setActiveTab('editor');
  };

  // Excluir Aula
  const handleDeleteLesson = (lessonId: string) => {
    if (savedLessons.length <= 1) return;
    const remaining = savedLessons.filter((l) => l.lesson.id !== lessonId);
    setSavedLessons(remaining);
    if (currentLesson.lesson.id === lessonId && remaining[0]) {
      setCurrentLesson(remaining[0]);
    }
  };

  // Iniciar Apresentação
  const handleStartPresentation = (startScene = 0) => {
    setPresentationStartScene(startScene);
    setIsPresentationOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* NAVBAR SUPERIOR */}
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeMode={currentLesson.lesson.generation_mode}
        onStartPresentation={() => handleStartPresentation(0)}
        canPresent={currentLesson.scenes.length > 0}
      />

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {activeTab === 'editor' && (
          <LessonEditor
            lesson={currentLesson}
            onUpdateLesson={handleUpdateCurrentLesson}
            onStartPresentation={(idx) => handleStartPresentation(idx)}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onOpenMaestroLogs={() => setIsMaestroLogsOpen(true)}
          />
        )}

        {activeTab === 'create' && (
          <LessonCreator
            onCreateLesson={handleCreateLesson}
            isGenerating={isGenerating}
          />
        )}

        {activeTab === 'library' && (
          <SavedLessonsList
            lessons={savedLessons}
            activeLessonId={currentLesson.lesson.id}
            onSelectLesson={(lesson) => {
              setCurrentLesson(lesson);
              setActiveTab('editor');
            }}
            onDuplicateLesson={handleDuplicateLesson}
            onDeleteLesson={handleDeleteLesson}
            onNewLesson={() => setActiveTab('create')}
            onStartPresentation={(lesson) => {
              setCurrentLesson(lesson);
              handleStartPresentation(0);
            }}
          />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeStudio
            onLoadLesson={(lesson) => {
              setCurrentLesson(lesson);
              setSavedLessons((prev) => [lesson, ...prev.filter((l) => l.lesson.id !== lesson.lesson.id)]);
            }}
            onNavigateToEditor={() => setActiveTab('editor')}
          />
        )}
      </main>

      {/* MODAL DE APRESENTAÇÃO FULLSCREEN */}
      {isPresentationOpen && (
        <PresentationMode
          lesson={currentLesson}
          initialSceneIndex={presentationStartScene}
          onClose={() => setIsPresentationOpen(false)}
          onUpdateScene={(updatedScene: Scene) => {
            const newScenes = currentLesson.scenes.map((s) =>
              s.id === updatedScene.id ? updatedScene : s
            );
            handleUpdateCurrentLesson({
              ...currentLesson,
              scenes: newScenes
            });
          }}
        />
      )}

      {/* MODAL DE EXPORTAÇÃO */}
      <ExportModal
        lesson={currentLesson}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* MODAL DE LOGS DO MAESTRO & AGENTES */}
      <MaestroLogViewer
        logs={currentLesson.agent_logs}
        isOpen={isMaestroLogsOpen}
        onClose={() => setIsMaestroLogsOpen(false)}
      />
    </div>
  );
}
