/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PEMARA AULA — SERVIDOR FULL-STACK EXPRESS + VITE
 */

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { KnowledgeStore } from './src/knowledge/studio/store';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Endpoint do Modo C (API Gemini)
app.post('/api/gemini/generate-lesson', async (req, res) => {
  try {
    const { subject, topic, grade, duration_minutes, didactic_style } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ error: 'GEMINI_API_KEY não configurada no ambiente.' });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const prompt = `Você é o gerador do PEMARA AULA. Produza uma aula no schema canônico lesson.json v1.0.
Parâmetros solicitados pelo professor:
- Disciplina: ${subject}
- Série: ${grade}
- Tema: ${topic}
- Duração: ${duration_minutes} min
- Estilo: ${didactic_style}

Retorne um JSON VÁLIDO com a seguinte estrutura estrita:
{
  "schema_version": "1.0",
  "lesson_version": 1,
  "renderer_version": "0.3.0",
  "lesson": {
    "id": "pemara-ai-${Date.now()}",
    "subject": "${subject}",
    "grade": "${grade}",
    "topic": "${topic}",
    "title": "Título Claro e Atraente",
    "duration_minutes": ${duration_minutes},
    "language": "pt-BR",
    "generation_mode": "MODE_C_API"
  },
  "objectives": [
    "Objetivo 1",
    "Objetivo 2",
    "Objetivo 3"
  ],
  "scenes": [
    {
      "id": "scene-01",
      "type": "title",
      "title": "Título Principal",
      "subtitle": "Subtítulo Pedagógico",
      "badge": "${subject.toUpperCase()} • ${grade}",
      "teacher_notes": "Orientação inicial"
    },
    {
      "id": "scene-02",
      "type": "text",
      "title": "Fundamentação Teórica",
      "content": [
        "Parágrafo explicativo conceitual 1.",
        "Parágrafo explicativo conceitual 2."
      ],
      "callout": "Ponto de atenção didático importante."
    },
    {
      "id": "scene-03",
      "type": "quiz",
      "title": "Verificação Diagnóstica",
      "question": "Pergunta conceitual sobre ${topic}?",
      "answers": [
        "Alternativa A",
        "Alternativa B",
        "Alternativa C (Correta)",
        "Alternativa D"
      ],
      "correct_index": 2,
      "explanation": "Explicação científica detalhada do porquê a alternativa é correta."
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ lesson: parsed });
  } catch (err: any) {
    console.error('Erro na geração via Gemini API:', err);
    res.status(500).json({ error: err.message || 'Erro interno na geração' });
  }
});

// Endpoint de Edição por Linguagem Natural
app.post('/api/lessons/:id/edit', (req, res) => {
  const { instruction, currentLesson } = req.body;
  if (!instruction || !currentLesson) {
    return res.status(400).json({ error: 'Instrução e aula atual são obrigatórias.' });
  }
  res.json({ success: true, instruction });
});

// ====================================================================
// ROTAS REST DO PEMARA KNOWLEDGE STUDIO (CORE RELACIONAL)
// ====================================================================

// Listar nós canônicos
app.get('/api/knowledge/nodes', (_req, res) => {
  try {
    const nodes = KnowledgeStore.getNodes();
    res.json({ nodes });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Listar relações ontológicas
app.get('/api/knowledge/relations', (_req, res) => {
  try {
    const relations = KnowledgeStore.getRelations();
    res.json({ relations });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Listar fontes acadêmicas e institucionais
app.get('/api/knowledge/sources', (_req, res) => {
  try {
    const sources = KnowledgeStore.getSources();
    res.json({ sources });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Listar matriz curricular BNCC
app.get('/api/knowledge/curriculum', (_req, res) => {
  try {
    const curriculum = KnowledgeStore.getCurriculum();
    res.json({ curriculum });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Listar itens em staging
app.get('/api/knowledge/staging', (_req, res) => {
  try {
    const staging = KnowledgeStore.getStaging();
    res.json({ staging });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Promover item do staging para o Knowledge Core permanente
app.post('/api/knowledge/staging/:id/approve', (req, res) => {
  try {
    const approved = KnowledgeStore.approveStagingNode(req.params.id);
    if (!approved) {
      return res.status(404).json({ error: 'Registro não encontrado no staging.' });
    }
    res.json({ success: true, node: approved });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Disparar execução de pipeline de ingestão externa
app.post('/api/knowledge/import', (req, res) => {
  try {
    const { provider = 'Wikidata', topic = 'Grécia Antiga', limit = 5 } = req.body || {};
    const batch = KnowledgeStore.runImportPipeline(provider, topic, limit);
    res.json({ success: true, batch });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Exportar DDL PostgreSQL canônico
app.get('/api/knowledge/schema.sql', (_req, res) => {
  try {
    const sqlPath = path.resolve('src', 'knowledge', 'studio', 'schema.sql');
    if (fs.existsSync(sqlPath)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.sendFile(sqlPath);
    } else {
      res.status(404).send('-- schema.sql não localizado');
    }
  } catch (err: any) {
    res.status(500).send(`-- Erro ao ler schema.sql: ${err.message}`);
  }
});

async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pemara Aula Dev/Prod Server running on port ${PORT}`);
  });
}

start();
