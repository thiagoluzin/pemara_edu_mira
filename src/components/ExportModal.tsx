/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PEMARA MOTOR DE EXPORTAÇÃO (Seção 25)
 * 1. Web / HTML Autossuficiente (Roda offline sem dependências)
 * 2. lesson.json Spec v1.0
 * 3. Impressão / PDF
 */

import React, { useState } from 'react';
import { LessonSpec } from '../types/lesson';
import { Download, Code, Globe, Printer, X, Check, Copy } from 'lucide-react';

interface Props {
  lesson: LessonSpec;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<Props> = ({ lesson, isOpen, onClose }) => {
  const [copiedJson, setCopiedJson] = useState<boolean>(false);

  if (!isOpen) return null;

  // 1. Exportação JSON Lesson Spec v1.0
  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(lesson, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pemara-lesson-${lesson.lesson.topic.toLowerCase().replace(/\s+/g, '-')}-v${lesson.lesson_version}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(lesson, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // 2. Exportação Web Standalone HTML Autossuficiente
  const handleDownloadStandaloneHtml = () => {
    const scenesJson = JSON.stringify(lesson.scenes);
    const lessonMetaJson = JSON.stringify(lesson.lesson);

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${lesson.lesson.title} — PEMARA AULA</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #030712;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      width: 100%;
      max-width: 900px;
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
    }
    .header {
      border-bottom: 1px solid #1e293b;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      background: #1e1b4b;
      color: #818cf8;
      border: 1px solid #4338ca;
    }
    h1 { font-size: 28px; font-weight: 800; color: #fff; margin-top: 8px; }
    p { font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 16px; }
    .controls {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #1e293b;
    }
    button {
      padding: 10px 20px;
      border-radius: 12px;
      font-weight: 700;
      border: none;
      cursor: pointer;
      background: #4f46e5;
      color: white;
      transition: background 0.2s;
    }
    button:hover { background: #4338ca; }
    button:disabled { opacity: 0.3; cursor: not-allowed; }
    .slide-counter { font-size: 12px; color: #64748b; font-family: monospace; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <span class="badge">${lesson.lesson.subject.toUpperCase()} • ${lesson.lesson.grade}</span>
        <h1>${lesson.lesson.title}</h1>
      </div>
      <span style="font-size: 12px; color: #94a3b8;">PEMARA AULA Offline</span>
    </div>

    <div id="slide-content"></div>

    <div class="controls">
      <button id="btn-prev" onclick="prevSlide()">Anterior</button>
      <span class="slide-counter" id="slide-num">Slide 1 de ${lesson.scenes.length}</span>
      <button id="btn-next" onclick="nextSlide()">Próximo</button>
    </div>
  </div>

  <script>
    const scenes = ${scenesJson};
    let currentIdx = 0;

    function render() {
      const scene = scenes[currentIdx];
      const el = document.getElementById('slide-content');
      document.getElementById('slide-num').innerText = 'Slide ' + (currentIdx + 1) + ' de ' + scenes.length;
      document.getElementById('btn-prev').disabled = currentIdx === 0;
      document.getElementById('btn-next').disabled = currentIdx === scenes.length - 1;

      let html = '<h2 style="font-size: 22px; margin-bottom: 12px; color: #e2e8f0;">' + scene.title + '</h2>';
      if (scene.subtitle) html += '<p style="color: #94a3b8; font-size: 16px;">' + scene.subtitle + '</p>';
      if (scene.content) {
        if (Array.isArray(scene.content)) {
          scene.content.forEach(p => { html += '<p>' + p + '</p>'; });
        } else {
          html += '<p>' + scene.content + '</p>';
        }
      }
      if (scene.callout) {
        html += '<div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 12px; border-radius: 8px; margin: 16px 0; color: #fde68a;"><strong>Atenção:</strong> ' + scene.callout + '</div>';
      }
      if (scene.question) {
        html += '<div style="background: #020617; padding: 16px; border-radius: 12px; border: 1px solid #1e293b; margin: 16px 0;"><p style="font-weight: 700; color: #fff; margin-bottom: 12px;">' + scene.question + '</p>';
        scene.answers.forEach((ans, i) => {
          html += '<div style="padding: 10px; margin: 6px 0; background: #0f172a; border-radius: 8px; border: 1px solid #334155; font-size: 14px;">' + String.fromCharCode(65 + i) + ') ' + ans + '</div>';
        });
        html += '</div>';
      }
      if (scene.teacher_notes) {
        html += '<div style="margin-top: 20px; padding: 12px; background: #1e1b4b; border-radius: 8px; font-size: 12px; color: #c7d2fe;"><strong>Nota do Professor:</strong> ' + scene.teacher_notes + '</div>';
      }
      el.innerHTML = html;
    }

    function nextSlide() { if (currentIdx < scenes.length - 1) { currentIdx++; render(); } }
    function prevSlide() { if (currentIdx > 0) { currentIdx--; render(); } }
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
    });
    render();
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pemara-apresentacao-${lesson.lesson.topic.toLowerCase().replace(/\s+/g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 3. Impressão / Salvar PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" />
            <h3 className="text-xl font-bold text-white">Exportar Aula PEMARA</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Opção 1: Web Standalone HTML (Prioridade 1 na Seção 25) */}
          <div
            onClick={handleDownloadStandaloneHtml}
            className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-indigo-950 border border-indigo-500/30 text-indigo-400 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Arquivo Web / HTML Standalone</h4>
                <p className="text-xs text-slate-400">
                  Arquivo único executável offline em qualquer projetor sem internet.
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-indigo-400" />
          </div>

          {/* Opção 2: JSON Lesson Spec v1.0 */}
          <div
            onClick={handleDownloadJson}
            className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition-transform">
                <Code className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Contrato lesson.json (v1.0)</h4>
                <p className="text-xs text-slate-400">
                  Especificação canônica de interoperabilidade do ecossistema Pemara.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyJson();
                }}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200"
                title="Copiar JSON"
              >
                {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <Download className="w-4 h-4 text-cyan-400" />
            </div>
          </div>

          {/* Opção 3: Impressão / PDF */}
          <div
            onClick={handlePrint}
            className="p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-950 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform">
                <Printer className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Imprimir ou Salvar em PDF</h4>
                <p className="text-xs text-slate-400">
                  Gera versão para impressão ou apostila didática para os alunos.
                </p>
              </div>
            </div>
            <Download className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
