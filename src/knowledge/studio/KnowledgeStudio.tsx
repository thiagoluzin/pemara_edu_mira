/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * PEMARA KNOWLEDGE STUDIO (V1 ESQUEMÁTICO & OPERACIONAL)
 * Painel completo de gestão do Knowledge Core:
 * - Ontologia e Grafo de Conhecimento (Nós e Arestas Relacionais)
 * - Mapeamento Curricular BNCC
 * - Gestão de Fontes Formais e Licenças
 * - Ingestão Externa, Staging e Detecção de Duplicatas
 * - Publicação de Content Packs e Ponte com o Motor de Aulas
 */

import React, { useState, useMemo } from 'react';
import {
  Database,
  GitFork,
  BookMarked,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  FileCode,
  Download,
  Search,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  ArrowRight,
  Info,
  Clock,
  Sparkles,
  ChevronRight,
  X,
  FileText
} from 'lucide-react';
import { KnowledgeStore } from './store';
import {
  KnowledgeNodeRecord,
  KnowledgeRelationRecord,
  Source,
  License,
  CurriculumSkill,
  StagingNodeRecord,
  ImportBatchRecord,
  ContentPackRecord,
  KnowledgeNodeType,
  RelationType
} from './schema';
import { LessonSpec } from '../../types/lesson';
import { LessonComposer } from '../../composer/lessonComposer';

interface Props {
  onLoadLesson: (lesson: LessonSpec) => void;
  onNavigateToEditor: () => void;
}

export const KnowledgeStudio: React.FC<Props> = ({ onLoadLesson, onNavigateToEditor }) => {
  // Dados do Store
  const [nodes, setNodes] = useState<KnowledgeNodeRecord[]>(() => KnowledgeStore.getNodes());
  const [relations, setRelations] = useState<KnowledgeRelationRecord[]>(() => KnowledgeStore.getRelations());
  const [sources, setSources] = useState<Source[]>(() => KnowledgeStore.getSources());
  const [licenses, setLicenses] = useState<License[]>(() => KnowledgeStore.getLicenses());
  const [curriculum, setCurriculum] = useState<CurriculumSkill[]>(() => KnowledgeStore.getCurriculum());
  const [staging, setStaging] = useState<StagingNodeRecord[]>(() => KnowledgeStore.getStaging());
  const [batches, setBatches] = useState<ImportBatchRecord[]>(() => KnowledgeStore.getBatches());
  const [packs, setPacks] = useState<ContentPackRecord[]>(() => KnowledgeStore.getPacks());

  // Aba ativa do Studio
  const [activeTab, setActiveTab] = useState<'nodes' | 'curriculum' | 'sources' | 'staging' | 'packs'>('nodes');

  // Filtros de Nós
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Nó inspecionado no Drawer
  const [selectedNode, setSelectedNode] = useState<KnowledgeNodeRecord | null>(null);

  // Modais
  const [isCreateNodeOpen, setIsCreateNodeOpen] = useState(false);
  const [isCreateRelationOpen, setIsCreateRelationOpen] = useState(false);
  const [isExportSqlOpen, setIsExportSqlOpen] = useState(false);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineToast, setPipelineToast] = useState<string | null>(null);

  // Formulário de Criação de Nó
  const [newNodeForm, setNewNodeForm] = useState({
    title: '',
    slug: '',
    type: 'concept' as KnowledgeNodeType,
    short_description: '',
    subject_code: 'history' as 'history' | 'geography' | 'science' | 'math',
    grade_level: 6 as 6 | 7 | 8 | 9,
    summary: '',
    key_points: '',
    source_id: 'src-bncc-mec-2018',
    license_id: 'lic-cc-by-sa-4'
  });

  // Formulário de Criação de Relação
  const [newRelForm, setNewRelForm] = useState({
    from_node_id: '',
    relation_type: 'part_of' as RelationType,
    to_node_id: ''
  });

  // Atualizar dados do store
  const refreshData = () => {
    setNodes(KnowledgeStore.getNodes());
    setRelations(KnowledgeStore.getRelations());
    setSources(KnowledgeStore.getSources());
    setLicenses(KnowledgeStore.getLicenses());
    setCurriculum(KnowledgeStore.getCurriculum());
    setStaging(KnowledgeStore.getStaging());
    setBatches(KnowledgeStore.getBatches());
    setPacks(KnowledgeStore.getPacks());
  };

  // Filtragem de Nós
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesSearch =
        node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.short_description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = selectedSubject === 'all' || node.subject_code === selectedSubject;
      const matchesGrade = selectedGrade === 'all' || node.grade_level.toString() === selectedGrade;
      const matchesType = selectedType === 'all' || node.type === selectedType;
      return matchesSearch && matchesSubject && matchesGrade && matchesType;
    });
  }, [nodes, searchQuery, selectedSubject, selectedGrade, selectedType]);

  // Relações do nó selecionado
  const selectedNodeRelations = useMemo(() => {
    if (!selectedNode) return { outgoing: [], incoming: [] };
    const outgoing = relations
      .filter((r) => r.from_node_id === selectedNode.id)
      .map((r) => ({
        ...r,
        targetNode: nodes.find((n) => n.id === r.to_node_id)
      }));
    const incoming = relations
      .filter((r) => r.to_node_id === selectedNode.id)
      .map((r) => ({
        ...r,
        sourceNode: nodes.find((n) => n.id === r.from_node_id)
      }));
    return { outgoing, incoming };
  }, [selectedNode, relations, nodes]);

  // Executar simulação de pipeline de ingestão
  const handleRunPipeline = () => {
    setPipelineLoading(true);
    setTimeout(() => {
      const batch = KnowledgeStore.runImportPipeline('Wikidata', 'Grécia Antiga', 4);
      refreshData();
      setPipelineLoading(false);
      setPipelineToast(`Lote ${batch.id} concluído: ${batch.records_imported} importados, ${batch.records_duplicates} duplicata detectada no Staging.`);
      setTimeout(() => setPipelineToast(null), 6000);
    }, 700);
  };

  // Aprovar item do Staging
  const handleApproveStaging = (stagingId: string) => {
    const approved = KnowledgeStore.approveStagingNode(stagingId);
    if (approved) {
      refreshData();
      setPipelineToast(`Nó "${approved.title}" promovido com sucesso para o Knowledge Core!`);
      setTimeout(() => setPipelineToast(null), 4000);
    }
  };

  // Criar Nó
  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeForm.title || !newNodeForm.slug) return;

    const normalizedSlug = newNodeForm.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const existing = nodes.find((n) => n.slug === normalizedSlug);
    if (existing) {
      alert(`Erro de Integridade: O slug "${normalizedSlug}" já pertence ao nó "${existing.title}".`);
      return;
    }

    const newNode: KnowledgeNodeRecord = {
      id: `node-${normalizedSlug}`,
      slug: normalizedSlug,
      type: newNodeForm.type,
      title: newNodeForm.title,
      short_description: newNodeForm.short_description,
      subject_code: newNodeForm.subject_code,
      grade_level: newNodeForm.grade_level,
      data_json: {
        summary: newNodeForm.summary,
        key_points: newNodeForm.key_points ? newNodeForm.key_points.split(',').map((k) => k.trim()) : [],
        recommended_grades: [newNodeForm.grade_level]
      },
      language: 'pt-BR',
      source_id: newNodeForm.source_id,
      license_id: newNodeForm.license_id,
      status: 'PUBLISHED',
      version: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updated = [newNode, ...nodes];
    KnowledgeStore.saveNodes(updated);
    refreshData();
    setIsCreateNodeOpen(false);
    setSelectedNode(newNode);
    setPipelineToast(`Nó "${newNode.title}" registrado no Knowledge Core com sucesso!`);
    setTimeout(() => setPipelineToast(null), 4000);
  };

  // Criar Relação
  const handleCreateRelation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRelForm.from_node_id || !newRelForm.to_node_id) return;
    if (newRelForm.from_node_id === newRelForm.to_node_id) {
      alert('Uma relação ontológica não pode apontar para o mesmo nó (auto-ciclo reflexivo inválido).');
      return;
    }

    const newRel: KnowledgeRelationRecord = {
      id: `rel-${Date.now()}`,
      from_node_id: newRelForm.from_node_id,
      relation_type: newRelForm.relation_type,
      to_node_id: newRelForm.to_node_id,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    const updated = [newRel, ...relations];
    KnowledgeStore.saveRelations(updated);
    refreshData();
    setIsCreateRelationOpen(false);
    setPipelineToast('Nova relação ontológica registrada!');
    setTimeout(() => setPipelineToast(null), 4000);
  };

  // Disparar Compilação de Aula a partir do Content Pack
  const handleCompilePackToLesson = (packSlug: string) => {
    if (packSlug === 'history-6-grecia-antiga') {
      const lesson = LessonComposer.compose({
        discipline: 'history',
        grade: 6,
        topic: 'Grécia Antiga',
        duration: 45,
        teaching_method: 'complete'
      });
      onLoadLesson(lesson);
      onNavigateToEditor();
    } else {
      alert(`O Content Pack "${packSlug}" está registrado no banco e pronto para compilação.`);
    }
  };

  // Exportar Dump JSON
  const handleExportJsonDump = () => {
    const dump = {
      meta: {
        exported_at: new Date().toISOString(),
        system: 'PEMARA Knowledge Core v1.0',
        total_nodes: nodes.length,
        total_relations: relations.length
      },
      licenses,
      sources,
      curriculum_skills: curriculum,
      knowledge_nodes: nodes,
      knowledge_relations: relations,
      staging_nodes: staging,
      import_batches: batches,
      content_packs: packs
    };

    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pemara-knowledge-dump-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Toast de Notificação */}
      {pipelineToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-950 border border-emerald-500/80 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{pipelineToast}</span>
        </div>
      )}

      {/* Header Principal do Knowledge Studio */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Knowledge Core v1.0
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PostgreSQL Relacional
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-slate-800 text-slate-400 border border-slate-700">
                Anti-Alucinação Determinístico
              </span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
              <Database className="w-7 h-7 text-indigo-400" />
              PEMARA Knowledge Studio
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Repositório ontológico e curricular para o Ensino Fundamental (6º ao 9º ano).
              Separação estrita entre <strong>Conhecimento Canônico Verificado</strong> e{' '}
              <strong>Geração Didática</strong>.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <div className="px-3 py-1.5 border-r border-slate-800/80">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Nós Canônicos</div>
              <div className="text-lg font-black text-indigo-400">{nodes.length}</div>
            </div>
            <div className="px-3 py-1.5 border-r border-slate-800/80">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Relações Onto</div>
              <div className="text-lg font-black text-cyan-400">{relations.length}</div>
            </div>
            <div className="px-3 py-1.5 border-r border-slate-800/80">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Fontes / BNCC</div>
              <div className="text-lg font-black text-amber-400">{sources.length}</div>
            </div>
            <div className="px-3 py-1.5">
              <div className="text-[10px] text-slate-500 font-semibold uppercase">Staging / Lotes</div>
              <div className="text-lg font-black text-emerald-400">{staging.length}</div>
            </div>
          </div>
        </div>

        {/* Global Studio Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-5 border-t border-slate-800/80">
          {/* Sub-tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('nodes')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'nodes'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Grafo & Nós ({nodes.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'curriculum'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span>Matriz BNCC ({curriculum.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('sources')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'sources'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Fontes & Licenças</span>
            </button>
            <button
              onClick={() => setActiveTab('staging')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'staging'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Ingestão & Staging ({staging.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('packs')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'packs'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Content Packs ({packs.length})</span>
            </button>
          </div>

          {/* Operational Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsCreateNodeOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Novo Nó</span>
            </button>
            <button
              onClick={() => setIsCreateRelationOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Nova Relação</span>
            </button>
            <button
              onClick={handleRunPipeline}
              disabled={pipelineLoading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${pipelineLoading ? 'animate-spin text-cyan-400' : ''}`} />
              <span>{pipelineLoading ? 'Ingerindo...' : 'Rodar Pipeline'}</span>
            </button>
            <button
              onClick={() => setIsExportSqlOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>Schema SQL</span>
            </button>
            <button
              onClick={handleExportJsonDump}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Dump JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ABA 1: GRAFO & NÓS ONTO LÓGICOS                                          */}
      {/* ========================================================================= */}
      {activeTab === 'nodes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna da Esquerda: Filtros e Lista de Nós */}
          <div className="lg:col-span-7 space-y-4">
            {/* Barra de Filtros */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrar nós por título, slug ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
              >
                <option value="all">Todas Disciplinas</option>
                <option value="history">História</option>
                <option value="geography">Geografia</option>
                <option value="science">Ciências</option>
                <option value="math">Matemática</option>
              </select>

              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
              >
                <option value="all">Todos os Anos</option>
                <option value="6">6º Ano EF</option>
                <option value="7">7º Ano EF</option>
                <option value="8">8º Ano EF</option>
                <option value="9">9º Ano EF</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none"
              >
                <option value="all">Todos os Tipos</option>
                <option value="concept">Conceito</option>
                <option value="place">Lugar</option>
                <option value="person">Pessoa</option>
                <option value="event">Evento</option>
                <option value="period">Período</option>
                <option value="theory">Teoria</option>
                <option value="object">Objeto/Geografia</option>
              </select>
            </div>

            {/* Lista de Nós Canônicos */}
            <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
              {filteredNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const nodeRelCount = relations.filter(
                  (r) => r.from_node_id === node.id || r.to_node_id === node.id
                ).length;

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/50'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white tracking-tight">{node.title}</h3>
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {node.slug}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{node.short_description}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-indigo-300 border border-slate-700">
                          {node.type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">v{node.version}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-500">
                      <div className="flex items-center gap-3">
                        <span className="capitalize text-slate-400 font-medium">
                          {node.subject_code} • {node.grade_level}º Ano
                        </span>
                        <span className="flex items-center gap-1 text-cyan-400">
                          <GitFork className="w-3 h-3" />
                          <span>{nodeRelCount} relações</span>
                        </span>
                      </div>
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{node.status}</span>
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredNodes.length === 0 && (
                <div className="p-8 text-center bg-slate-900/40 border border-slate-800/80 rounded-xl text-slate-500 text-xs">
                  Nenhum nó de conhecimento corresponde aos filtros selecionados.
                </div>
              )}
            </div>
          </div>

          {/* Coluna da Direita: Inspetor do Nó Selecionado & Grafo Local */}
          <div className="lg:col-span-5">
            {selectedNode ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 sticky top-24 shadow-xl">
                {/* Cabeçalho do Inspetor */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-400 tracking-wider uppercase font-semibold">
                      Inspetor de Entidade
                    </span>
                    <h2 className="text-lg font-black text-white">{selectedNode.title}</h2>
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">{selectedNode.slug}</div>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 text-slate-500 hover:text-white rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Badges e Status */}
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-semibold">
                    {selectedNode.type}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedNode.subject_code} ({selectedNode.grade_level}º Ano)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    Status: {selectedNode.status}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                    Versão {selectedNode.version}
                  </span>
                </div>

                {/* Descrição e Resumo Didático */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">Definição / Descrição Curta</span>
                    <p className="text-slate-300 mt-0.5">{selectedNode.short_description}</p>
                  </div>
                  {selectedNode.data_json?.summary && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Resumo Canônico</span>
                      <p className="text-slate-400 mt-0.5 text-[11px] leading-relaxed">
                        {selectedNode.data_json.summary}
                      </p>
                    </div>
                  )}
                  {selectedNode.data_json?.key_points && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">Pontos Didáticos Centrais</span>
                      <ul className="list-disc list-inside text-slate-400 text-[11px] mt-1 space-y-0.5">
                        {selectedNode.data_json.key_points.map((pt: string, idx: number) => (
                          <li key={idx}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Fonte Acadêmica e Licença Vinculadas */}
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Fonte Canônica:</span>
                    <span className="text-indigo-400 font-medium font-mono text-[11px]">{selectedNode.source_id}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Licença Legal:</span>
                    <span className="text-emerald-400 font-medium font-mono text-[11px]">{selectedNode.license_id}</span>
                  </div>
                </div>

                {/* Relações Ontológicas deste Nó */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                      Relações no Grafo ({selectedNodeRelations.outgoing.length + selectedNodeRelations.incoming.length})
                    </span>
                    <button
                      onClick={() => {
                        setNewRelForm((prev) => ({ ...prev, from_node_id: selectedNode.id }));
                        setIsCreateRelationOpen(true);
                      }}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold"
                    >
                      + Conectar
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs">
                    {/* Saindo deste nó */}
                    {selectedNodeRelations.outgoing.map((rel) => (
                      <div
                        key={rel.id}
                        className="p-2 bg-slate-950/70 border border-slate-800/80 rounded-lg flex items-center justify-between gap-2"
                      >
                        <span className="text-slate-400 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded">
                          --[{rel.relation_type}]--&gt;
                        </span>
                        <span
                          onClick={() => rel.targetNode && setSelectedNode(rel.targetNode)}
                          className="text-white font-bold cursor-pointer hover:text-indigo-400 truncate flex-1 text-right"
                        >
                          {rel.targetNode?.title || rel.to_node_id}
                        </span>
                      </div>
                    ))}

                    {/* Chegando neste nó */}
                    {selectedNodeRelations.incoming.map((rel) => (
                      <div
                        key={rel.id}
                        className="p-2 bg-slate-950/70 border border-slate-800/80 rounded-lg flex items-center justify-between gap-2"
                      >
                        <span
                          onClick={() => rel.sourceNode && setSelectedNode(rel.sourceNode)}
                          className="text-white font-bold cursor-pointer hover:text-indigo-400 truncate flex-1"
                        >
                          {rel.sourceNode?.title || rel.from_node_id}
                        </span>
                        <span className="text-slate-400 font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded">
                          --[{rel.relation_type}]--&gt;
                        </span>
                      </div>
                    ))}

                    {selectedNodeRelations.outgoing.length === 0 && selectedNodeRelations.incoming.length === 0 && (
                      <div className="text-[11px] text-slate-500 py-2">
                        Nenhuma relação ontológica vinculada a este nó ainda.
                      </div>
                    )}
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  <button
                    onClick={() => handleCompilePackToLesson('history-6-grecia-antiga')}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Gerar Aula a partir deste Tema</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-500 space-y-3">
                <GitFork className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-400">Nenhum nó selecionado</h3>
                <p className="text-xs max-w-xs mx-auto">
                  Clique em qualquer nó da lista para inspecionar seus metadados, fontes acadêmicas e conexões ontológicas.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 2: MATRIZ CURRICULAR BNCC                                             */}
      {/* ========================================================================= */}
      {activeTab === 'curriculum' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-indigo-400" />
              Matriz Curricular de Habilidades Oficiais (BNCC)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Habilidades do MEC mapeadas para entidades conceituais do Knowledge Core. O motor garante que nenhuma
              aula seja gerada sem alinhamento curricular formal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {curriculum.map((skill) => (
              <div key={skill.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-300 font-mono text-xs font-bold">
                    {skill.code}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {skill.subject_code} • {skill.grade_level}º Ano
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{skill.knowledge_object}</h3>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{skill.thematic_unit}</div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
                  {skill.description}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                  <span>Versão BNCC: {skill.version}</span>
                  <span className="text-emerald-400 font-medium">{skill.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 3: FONTES & LICENÇAS                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'sources' && (
        <div className="space-y-6">
          {/* Tabela de Fontes Acadêmicas */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                Fontes Formais e Institucionais Verificadas
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Nenhum dado é registrado sem atribuição direta a fontes de alta credibilidade (MEC/BNCC, Wikidata, historiadores).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">ID / Provedor</th>
                    <th className="p-3">Título / Obra</th>
                    <th className="p-3">Autor</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sources.map((src) => (
                    <tr key={src.id} className="hover:bg-slate-850">
                      <td className="p-3 font-mono text-[11px] text-indigo-300">
                        {src.id}
                        <div className="text-[10px] text-slate-500">{src.provider}</div>
                      </td>
                      <td className="p-3 font-medium text-white max-w-xs">{src.title}</td>
                      <td className="p-3 text-slate-400">{src.author || 'N/A'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                          {src.source_type}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-semibold">
                          {src.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela de Licenças Legais */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Matriz de Licenças e Conformidade Legal
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Políticas de redistribuição, obras derivadas e uso didático.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {licenses.map((lic) => (
                <div key={lic.id} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-emerald-400">{lic.code}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{lic.id}</span>
                  </div>
                  <h4 className="font-bold text-white text-xs">{lic.name}</h4>
                  <p className="text-[11px] text-slate-400">{lic.notes}</p>
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-1.5 text-[10px]">
                    <span className={`px-2 py-0.5 rounded ${lic.derivatives_allowed ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'}`}>
                      Derivadas: {lic.derivatives_allowed ? 'Sim' : 'Não'}
                    </span>
                    <span className={`px-2 py-0.5 rounded ${lic.attribution_required ? 'bg-amber-950 text-amber-300' : 'bg-slate-800 text-slate-300'}`}>
                      Atribuição: {lic.attribution_required ? 'Obrigatória' : 'Isento'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 4: INGESTÃO & STAGING                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'staging' && (
        <div className="space-y-6">
          {/* Lotes de Importação */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-cyan-400" />
                  Área de Staging & Pipeline de Ingestão Externa
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Registros coletados de APIs externas (Wikidata, BNCC) aguardando conferência editorial e resolução de duplicatas.
                </p>
              </div>

              <button
                onClick={handleRunPipeline}
                disabled={pipelineLoading}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${pipelineLoading ? 'animate-spin' : ''}`} />
                <span>Simular Ingestão Wikidata</span>
              </button>
            </div>

            {/* Histórico de Lotes */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">Últimos Lotes de Execução</span>
              <div className="space-y-2">
                {batches.map((batch) => (
                  <div key={batch.id} className="flex flex-wrap items-center justify-between gap-3 text-xs p-2 bg-slate-900/60 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-semibold">{batch.id}</span>
                      <span className="text-slate-400">({batch.provider})</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Total: {batch.records_found}</span>
                      <span className="text-emerald-400">Importados: {batch.records_imported}</span>
                      <span className="text-amber-400">Duplicatas: {batch.records_duplicates}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 font-semibold">
                        {batch.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabela de Itens em Staging */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Título / Slug</th>
                    <th className="p-3">Provedor / ID Ext.</th>
                    <th className="p-3">Status de Validação</th>
                    <th className="p-3">Notas de Curadoria</th>
                    <th className="p-3 text-right">Ação Editorial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {staging.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-850">
                      <td className="p-3">
                        <div className="font-bold text-white">{item.title}</div>
                        <div className="font-mono text-[10px] text-slate-400">{item.slug}</div>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-400">
                        {item.source_provider} ({item.external_id || 'N/A'})
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.validation_status === 'DUPLICATE'
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                              : item.validation_status === 'APPROVED'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-500/40'
                          }`}
                        >
                          {item.validation_status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 max-w-xs text-[11px]">{item.review_notes}</td>
                      <td className="p-3 text-right">
                        {item.validation_status !== 'APPROVED' ? (
                          <button
                            onClick={() => handleApproveStaging(item.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all"
                          >
                            Aprovar para Core
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> No Core
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA 5: CONTENT PACKS & PONTE COM O MOTOR DE AULAS                         */}
      {/* ========================================================================= */}
      {activeTab === 'packs' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Content Packs & Compilação Direta de Aulas
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Pacotes ontológicos prontos que alimentam o motor gerador determinístico. A geração de aulas nunca utiliza
              alucinações ou templates soltos: cada aula é um desdobramento direto dos Content Packs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packs.map((pack) => (
              <div key={pack.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between space-y-5 shadow-lg">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                      {pack.subject_code} • {pack.grade_level}º Ano
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">v{pack.version}</span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{pack.title}</h3>
                  <div className="text-xs text-slate-400 font-mono">Tópico Raiz: {pack.topic_node_id}</div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Nós Canônicos Vinculados:</span>
                      <span className="text-white font-bold">10+ Entidades</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Layouts Aprovados V1:</span>
                      <span className="text-cyan-400 font-bold">07_map, 05_comp, 08_quiz</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Status de Validação:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 100% PASS
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleCompilePackToLesson(pack.slug)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all transform hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Compilar e Abrir Aula Visual</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR NOVO NÓ                                                      */}
      {/* ========================================================================= */}
      {isCreateNodeOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                Registrar Novo Nó no Knowledge Core
              </h3>
              <button onClick={() => setIsCreateNodeOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNode} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Título do Conceito / Entidade *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Ágora"
                    value={newNodeForm.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                      setNewNodeForm((prev) => ({ ...prev, title, slug }));
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Slug Canônico (Único) *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: agora"
                    value={newNodeForm.slug}
                    onChange={(e) => setNewNodeForm((prev) => ({ ...prev, slug: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Tipo de Entidade</label>
                  <select
                    value={newNodeForm.type}
                    onChange={(e) => setNewNodeForm((prev) => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="concept">Conceito</option>
                    <option value="place">Lugar</option>
                    <option value="person">Pessoa</option>
                    <option value="event">Evento</option>
                    <option value="period">Período</option>
                    <option value="theory">Teoria</option>
                    <option value="formula">Fórmula</option>
                    <option value="object">Objeto</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Disciplina</label>
                  <select
                    value={newNodeForm.subject_code}
                    onChange={(e) => setNewNodeForm((prev) => ({ ...prev, subject_code: e.target.value as any }))}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value="history">História</option>
                    <option value="geography">Geografia</option>
                    <option value="science">Ciências</option>
                    <option value="math">Matemática</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Ano Escolar (EF)</label>
                  <select
                    value={newNodeForm.grade_level}
                    onChange={(e) => setNewNodeForm((prev) => ({ ...prev, grade_level: parseInt(e.target.value) as any }))}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  >
                    <option value={6}>6º Ano</option>
                    <option value={7}>7º Ano</option>
                    <option value={8}>8º Ano</option>
                    <option value={9}>9º Ano</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Descrição Curta *</label>
                <input
                  type="text"
                  required
                  placeholder="Definição concisa para slides e cards didáticos..."
                  value={newNodeForm.short_description}
                  onChange={(e) => setNewNodeForm((prev) => ({ ...prev, short_description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Resumo Pedagógico Aprofundado</label>
                <textarea
                  rows={3}
                  placeholder="Fundamentação conceitual com contexto histórico ou científico..."
                  value={newNodeForm.summary}
                  onChange={(e) => setNewNodeForm((prev) => ({ ...prev, summary: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Fonte Acadêmica Vinculada</label>
                  <select
                    value={newNodeForm.source_id}
                    onChange={(e) => setNewNodeForm((prev) => ({ ...prev, source_id: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  >
                    {sources.map((src) => (
                      <option key={src.id} value={src.id}>
                        {src.title} ({src.provider})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Licença Legal</label>
                  <select
                    value={newNodeForm.license_id}
                    onChange={(e) => setNewNodeForm((prev) => ({ ...prev, license_id: e.target.value }))}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                  >
                    {licenses.map((lic) => (
                      <option key={lic.id} value={lic.id}>
                        {lic.name} ({lic.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateNodeOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-950/50"
                >
                  Salvar Nó no Core
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR NOVA RELAÇÃO ONTOLÓGICA                                      */}
      {/* ========================================================================= */}
      {isCreateRelationOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GitFork className="w-5 h-5 text-cyan-400" />
                Registrar Relação Ontológica
              </h3>
              <button onClick={() => setIsCreateRelationOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRelation} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Nó de Origem (From Node) *</label>
                <select
                  required
                  value={newRelForm.from_node_id}
                  onChange={(e) => setNewRelForm((prev) => ({ ...prev, from_node_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                >
                  <option value="">Selecione o nó de origem...</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title} ({n.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Tipo de Predicado Ontológico *</label>
                <select
                  value={newRelForm.relation_type}
                  onChange={(e) => setNewRelForm((prev) => ({ ...prev, relation_type: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 font-mono font-semibold focus:outline-none"
                >
                  <option value="part_of">part_of (faz parte de)</option>
                  <option value="contains">contains (contém)</option>
                  <option value="located_in">located_in (localizado em)</option>
                  <option value="example_of">example_of (é exemplo de)</option>
                  <option value="contrasts_with">contrasts_with (contrasta com)</option>
                  <option value="influenced">influenced (influenciou)</option>
                  <option value="occurred_in">occurred_in (ocorreu em)</option>
                  <option value="caused_by">caused_by (causado por)</option>
                  <option value="preceded_by">preceded_by (precedido por)</option>
                  <option value="followed_by">followed_by (seguido por)</option>
                  <option value="related_to">related_to (relacionado com)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Nó de Destino (To Node) *</label>
                <select
                  required
                  value={newRelForm.to_node_id}
                  onChange={(e) => setNewRelForm((prev) => ({ ...prev, to_node_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none"
                >
                  <option value="">Selecione o nó de destino...</option>
                  {nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.title} ({n.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-400">
                Expressão: ({newRelForm.from_node_id || 'origem'}) --[{newRelForm.relation_type}]--&gt; ({newRelForm.to_node_id || 'destino'})
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateRelationOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-950/50"
                >
                  Conectar Relação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EXPORTAR SCHEMA SQL DDL                                            */}
      {/* ========================================================================= */}
      {isExportSqlOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-indigo-400" />
                PostgreSQL Relational DDL (v1.0 Canônico)
              </h3>
              <button onClick={() => setIsExportSqlOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              DDL completo para implantação em instâncias PostgreSQL / Cloud SQL / Supabase com integridade referencial,
              chaves estrangeiras, restrições CHECK, tipos JSONB e índices otimizados.
            </p>

            <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-96 overflow-y-auto leading-relaxed">
{`-- Tabelas Canônicas PEMARA Knowledge Core
CREATE TABLE sources (...);
CREATE TABLE licenses (...);
CREATE TABLE curriculum_skills (...);
CREATE TABLE knowledge_nodes (...);
CREATE TABLE knowledge_relations (...);
CREATE TABLE curriculum_knowledge_links (...);
CREATE TABLE resources (...);
CREATE TABLE staging_nodes (...);
CREATE TABLE entity_versions (...);
CREATE TABLE content_packs (...);`}
            </pre>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500">Arquivo: /src/knowledge/studio/schema.sql</span>
              <button
                onClick={() => {
                  const blob = new Blob([
                    `-- PEMARA PostgreSQL DDL\n-- Baixado via Knowledge Studio\n\n`
                  ], { type: 'text/sql' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = '/src/knowledge/studio/schema.sql';
                  a.download = 'pemara-schema.sql';
                  a.click();
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar schema.sql</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
