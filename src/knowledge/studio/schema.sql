-- ====================================================================
-- PEMARA KNOWLEDGE CORE & STUDIO — POSTGRESQL RELATIONAL DDL (v1.0)
-- Banco de dados relacional canônico para entidades curriculares, ontologia,
-- fontes acadêmicas, licenças, recursos multimídia, staging e auditoria.
-- ====================================================================

-- 1. Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Fontes Formais e Acadêmicas
CREATE TABLE IF NOT EXISTS sources (
    id VARCHAR(64) PRIMARY KEY,
    provider VARCHAR(128) NOT NULL,
    title VARCHAR(255) NOT NULL,
    url TEXT,
    author VARCHAR(255),
    language VARCHAR(10) DEFAULT 'pt-BR',
    source_type VARCHAR(32) NOT NULL CHECK (source_type IN ('official', 'open_data', 'open_content', 'encyclopedia', 'institutional', 'internal')),
    retrieved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'verified' CHECK (status IN ('verified', 'curated', 'under_review'))
);

-- 3. Tabela de Licenças Legais
CREATE TABLE IF NOT EXISTS licenses (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(64) NOT NULL,
    commercial_use BOOLEAN DEFAULT FALSE,
    derivatives_allowed BOOLEAN DEFAULT TRUE,
    attribution_required BOOLEAN DEFAULT TRUE,
    redistribution_allowed BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- 4. Tabela de Habilidades Curriculares (BNCC)
CREATE TABLE IF NOT EXISTS curriculum_skills (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL, -- Ex: 'EF06HI09'
    thematic_unit VARCHAR(255) NOT NULL,
    knowledge_object VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    grade_level SMALLINT NOT NULL CHECK (grade_level BETWEEN 6 AND 9),
    subject_code VARCHAR(32) NOT NULL CHECK (subject_code IN ('history', 'geography', 'science', 'math')),
    source_id VARCHAR(64) REFERENCES sources(id) ON DELETE RESTRICT,
    status VARCHAR(32) DEFAULT 'OFFICIAL_BNCC',
    version VARCHAR(32) DEFAULT '2018.3'
);

-- 5. Tabela Canônica de Nós de Conhecimento (Knowledge Graph Nodes)
CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(128) UNIQUE NOT NULL,
    type VARCHAR(32) NOT NULL CHECK (type IN ('concept', 'event', 'person', 'place', 'period', 'formula', 'process', 'definition', 'theory', 'object')),
    title VARCHAR(255) NOT NULL,
    short_description TEXT NOT NULL,
    subject_code VARCHAR(32) NOT NULL CHECK (subject_code IN ('history', 'geography', 'science', 'math')),
    grade_level SMALLINT NOT NULL CHECK (grade_level BETWEEN 6 AND 9),
    data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    language VARCHAR(10) DEFAULT 'pt-BR',
    source_id VARCHAR(64) REFERENCES sources(id) ON DELETE RESTRICT,
    license_id VARCHAR(64) REFERENCES licenses(id) ON DELETE RESTRICT,
    status VARCHAR(32) DEFAULT 'PUBLISHED' CHECK (status IN ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'DEPRECATED', 'REJECTED')),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_slug ON knowledge_nodes(slug);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_subject_grade ON knowledge_nodes(subject_code, grade_level);
CREATE INDEX IF NOT EXISTS idx_knowledge_nodes_type ON knowledge_nodes(type);

-- 6. Tabela de Relações Ontológicas (Knowledge Graph Edges)
CREATE TABLE IF NOT EXISTS knowledge_relations (
    id VARCHAR(64) PRIMARY KEY,
    from_node_id VARCHAR(64) NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    relation_type VARCHAR(32) NOT NULL CHECK (relation_type IN ('part_of', 'contains', 'located_in', 'preceded_by', 'followed_by', 'caused_by', 'influenced', 'related_to', 'example_of', 'requires', 'contrasts_with', 'created_by', 'occurred_in')),
    to_node_id VARCHAR(64) NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    source_id VARCHAR(64) REFERENCES sources(id) ON DELETE SET NULL,
    status VARCHAR(32) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVIEW')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_relation UNIQUE (from_node_id, relation_type, to_node_id)
);

CREATE INDEX IF NOT EXISTS idx_relations_from ON knowledge_relations(from_node_id);
CREATE INDEX IF NOT EXISTS idx_relations_to ON knowledge_relations(to_node_id);

-- 7. Tabela de Ligação Habilidade Curricular <-> Nó de Conhecimento
CREATE TABLE IF NOT EXISTS curriculum_knowledge_links (
    id VARCHAR(64) PRIMARY KEY,
    curriculum_skill_id VARCHAR(64) NOT NULL REFERENCES curriculum_skills(id) ON DELETE CASCADE,
    knowledge_node_id VARCHAR(64) NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    priority SMALLINT DEFAULT 1,
    required BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_curr_knowledge_link UNIQUE (curriculum_skill_id, knowledge_node_id)
);

-- 8. Tabela de Recursos Visuais e Didáticos
CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(32) NOT NULL CHECK (type IN ('image', 'map', 'diagram', 'chart', 'timeline', 'comparison_table', 'simulation', 'quiz_asset')),
    title VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(64) NOT NULL,
    width INTEGER,
    height INTEGER,
    source_id VARCHAR(64) REFERENCES sources(id) ON DELETE RESTRICT,
    license_id VARCHAR(64) REFERENCES licenses(id) ON DELETE RESTRICT,
    status VARCHAR(32) DEFAULT 'ACTIVE',
    metadata_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resource_links (
    id VARCHAR(64) PRIMARY KEY,
    resource_id VARCHAR(64) NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    knowledge_node_id VARCHAR(64) NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL CHECK (role IN ('main_image', 'map', 'comparison', 'illustration', 'simulation', 'quiz_asset'))
);

-- 9. Tabela de Lotes de Importação Externa (Wikidata / BNCC)
CREATE TABLE IF NOT EXISTS import_batches (
    id VARCHAR(64) PRIMARY KEY,
    provider VARCHAR(64) NOT NULL,
    started_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMPTZ,
    records_found INTEGER DEFAULT 0,
    records_imported INTEGER DEFAULT 0,
    records_rejected INTEGER DEFAULT 0,
    records_duplicates INTEGER DEFAULT 0,
    status VARCHAR(32) DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'FAILED')),
    log_path TEXT
);

-- 10. Tabela de Staging para Curadoria Editorial e Anti-Duplicatas
CREATE TABLE IF NOT EXISTS staging_nodes (
    id VARCHAR(64) PRIMARY KEY,
    import_batch_id VARCHAR(64) REFERENCES import_batches(id) ON DELETE CASCADE,
    source_provider VARCHAR(64) NOT NULL,
    external_id VARCHAR(128),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(128) NOT NULL,
    type VARCHAR(32) NOT NULL,
    short_description TEXT NOT NULL,
    data_json JSONB DEFAULT '{}'::jsonb,
    validation_status VARCHAR(32) DEFAULT 'NEW' CHECK (validation_status IN ('NEW', 'DUPLICATE', 'CONFLICT', 'VALID', 'APPROVED', 'DISCARDED')),
    duplicate_candidate_id VARCHAR(64) REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Tabela de Auditoria e Versionamento Imutável de Entidades
CREATE TABLE IF NOT EXISTS entity_versions (
    id VARCHAR(64) PRIMARY KEY,
    entity_type VARCHAR(32) NOT NULL,
    entity_id VARCHAR(64) NOT NULL,
    version INTEGER NOT NULL,
    snapshot_json JSONB NOT NULL,
    changed_by VARCHAR(128) NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    change_reason TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_entity_versions_lookup ON entity_versions(entity_type, entity_id, version);

-- 12. Tabela de Content Packs Publicados
CREATE TABLE IF NOT EXISTS content_packs (
    id VARCHAR(64) PRIMARY KEY,
    slug VARCHAR(128) UNIQUE NOT NULL,
    subject_code VARCHAR(32) NOT NULL,
    grade_level SMALLINT NOT NULL,
    topic_node_id VARCHAR(64) REFERENCES knowledge_nodes(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    version VARCHAR(32) NOT NULL,
    status VARCHAR(32) DEFAULT 'PUBLISHED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMPTZ
);
