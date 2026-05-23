-- ============================================================
-- Schema gerado a partir dos models Django
-- Sistema de Auditoria ISO 27002 / 27701
-- ============================================================

-- ------------------------------------------------------------
-- Tabelas auxiliares 27002
-- ------------------------------------------------------------

CREATE TABLE tipos_controle (
    id_tipo_controle SERIAL PRIMARY KEY,
    nome             VARCHAR(50)  NOT NULL UNIQUE,
    descricao        TEXT         NOT NULL
);

CREATE TABLE propriedades_si (
    id_propriedade SERIAL PRIMARY KEY,
    nome           VARCHAR(50)  NOT NULL UNIQUE,
    descricao      TEXT         NOT NULL
);

CREATE TABLE conceitos_si (
    id_conceito SERIAL PRIMARY KEY,
    nome        VARCHAR(50)  NOT NULL UNIQUE,
    descricao   TEXT         NOT NULL
);

CREATE TABLE capacidades_operacionais (
    id_capacidade SERIAL PRIMARY KEY,
    nome          VARCHAR(50)  NOT NULL UNIQUE,
    descricao     TEXT         NOT NULL
);

CREATE TABLE dominios_seguranca (
    id_dominio        SERIAL PRIMARY KEY,
    nome              VARCHAR(50)  NOT NULL UNIQUE,
    descricao         TEXT         NOT NULL,
    propriedade_inclui VARCHAR(200) NOT NULL
);

CREATE TABLE temas_controle (
    id_tema   SERIAL PRIMARY KEY,
    nome      VARCHAR(50)  NOT NULL UNIQUE,
    descricao TEXT         NOT NULL
);

-- ------------------------------------------------------------
-- Tabelas auxiliares 27701
-- ------------------------------------------------------------

CREATE TABLE atributos_anexos (
    id_atributo SERIAL PRIMARY KEY,
    nome        VARCHAR(100) NOT NULL,
    descricao   VARCHAR(255) NOT NULL
);

CREATE TABLE tipos_controle_anexos (
    id_tipo_controle_anexo SERIAL PRIMARY KEY,
    nome                   VARCHAR(100) NOT NULL,
    descricao              VARCHAR(255) NOT NULL
);

-- ------------------------------------------------------------
-- Normas
-- ------------------------------------------------------------

CREATE TABLE normas (
    id_norma  SERIAL PRIMARY KEY,
    nome      VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT         NOT NULL,
    versao    VARCHAR(20)  NOT NULL
);

-- ------------------------------------------------------------
-- Controles
-- ------------------------------------------------------------

CREATE TABLE controles_27002 (
    id_controle   SERIAL PRIMARY KEY,
    norma_id      INTEGER      NOT NULL REFERENCES normas(id_norma) ON DELETE CASCADE,
    indice_norma  VARCHAR(20)  NOT NULL,
    titulo        VARCHAR(255) NOT NULL,
    descricao     TEXT         NOT NULL,
    categoria     VARCHAR(100),
    UNIQUE (norma_id, indice_norma)
);

-- Tabelas de junção M2M — Controle27002
CREATE TABLE controles_27002_tipos_controle (
    controle_id      INTEGER NOT NULL REFERENCES controles_27002(id_controle) ON DELETE CASCADE,
    tipo_controle_id INTEGER NOT NULL REFERENCES tipos_controle(id_tipo_controle) ON DELETE CASCADE,
    PRIMARY KEY (controle_id, tipo_controle_id)
);

CREATE TABLE controles_27002_propriedades_si (
    controle_id    INTEGER NOT NULL REFERENCES controles_27002(id_controle) ON DELETE CASCADE,
    propriedade_id INTEGER NOT NULL REFERENCES propriedades_si(id_propriedade) ON DELETE CASCADE,
    PRIMARY KEY (controle_id, propriedade_id)
);

CREATE TABLE controles_27002_conceitos_si (
    controle_id INTEGER NOT NULL REFERENCES controles_27002(id_controle) ON DELETE CASCADE,
    conceito_id INTEGER NOT NULL REFERENCES conceitos_si(id_conceito) ON DELETE CASCADE,
    PRIMARY KEY (controle_id, conceito_id)
);

CREATE TABLE controles_27002_capacidades_operacionais (
    controle_id   INTEGER NOT NULL REFERENCES controles_27002(id_controle) ON DELETE CASCADE,
    capacidade_id INTEGER NOT NULL REFERENCES capacidades_operacionais(id_capacidade) ON DELETE CASCADE,
    PRIMARY KEY (controle_id, capacidade_id)
);

CREATE TABLE controles_27002_dominios_seguranca (
    controle_id INTEGER NOT NULL REFERENCES controles_27002(id_controle) ON DELETE CASCADE,
    dominio_id  INTEGER NOT NULL REFERENCES dominios_seguranca(id_dominio) ON DELETE CASCADE,
    PRIMARY KEY (controle_id, dominio_id)
);

CREATE TABLE controles_27002_temas_controle (
    controle_id INTEGER NOT NULL REFERENCES controles_27002(id_controle) ON DELETE CASCADE,
    tema_id     INTEGER NOT NULL REFERENCES temas_controle(id_tema) ON DELETE CASCADE,
    PRIMARY KEY (controle_id, tema_id)
);

-- 27701
CREATE TABLE controles_27701 (
    id_controle      SERIAL PRIMARY KEY,
    norma_id         INTEGER      NOT NULL REFERENCES normas(id_norma) ON DELETE CASCADE,
    indice_norma     VARCHAR(20)  NOT NULL,
    titulo           VARCHAR(255) NOT NULL,
    anexoB           VARCHAR(255),
    orientacao_anexoB TEXT,
    UNIQUE (norma_id, indice_norma)
);

CREATE TABLE controles_27701_atributos_anexos (
    controle_id  INTEGER NOT NULL REFERENCES controles_27701(id_controle) ON DELETE CASCADE,
    atributo_id  INTEGER NOT NULL REFERENCES atributos_anexos(id_atributo) ON DELETE CASCADE,
    PRIMARY KEY (controle_id, atributo_id)
);

CREATE TABLE controles_27701_tipos_controle_anexos (
    controle_id            INTEGER NOT NULL REFERENCES controles_27701(id_controle) ON DELETE CASCADE,
    tipo_controle_anexo_id INTEGER NOT NULL REFERENCES tipos_controle_anexos(id_tipo_controle_anexo) ON DELETE CASCADE,
    PRIMARY KEY (controle_id, tipo_controle_anexo_id)
);

-- ------------------------------------------------------------
-- Empresas, Auditores e Auditorias
-- ------------------------------------------------------------

CREATE TABLE empresa (
    id_empresa SERIAL PRIMARY KEY,
    nome       VARCHAR(100) NOT NULL UNIQUE,
    cnpj       VARCHAR(20)  NOT NULL UNIQUE,
    porte      VARCHAR(20)  NOT NULL,
    setor      VARCHAR(50)  NOT NULL,
    descricao  TEXT         NOT NULL
);

CREATE TABLE auditores (
    id_auditor        SERIAL PRIMARY KEY,
    nome_auditor      VARCHAR(100) NOT NULL,
    documento_auditor VARCHAR(20)  NOT NULL
);

CREATE TABLE auditorias (
    id_auditoria   SERIAL PRIMARY KEY,
    nome           VARCHAR(120) NOT NULL DEFAULT '',
    empresa_id     INTEGER     NOT NULL REFERENCES empresa(id_empresa)   ON DELETE CASCADE,
    norma_id       INTEGER     NOT NULL REFERENCES normas(id_norma)      ON DELETE CASCADE,
    auditor_id     INTEGER     NOT NULL REFERENCES auditores(id_auditor) ON DELETE CASCADE,
    data_auditoria DATE        NOT NULL,
    descricao      TEXT        NOT NULL,
    status         VARCHAR(20) NOT NULL
        CHECK (status IN ('CONFORME', 'NAO_CONFORME', 'NAO_APLICA'))
);

-- ------------------------------------------------------------
-- Respostas e Evidências
-- ------------------------------------------------------------

CREATE TABLE respostas_auditoria_27002 (
    id_resposta27002 SERIAL PRIMARY KEY,
    auditoria_id     INTEGER     NOT NULL REFERENCES auditorias(id_auditoria)    ON DELETE CASCADE,
    controle_id      INTEGER     NOT NULL REFERENCES controles_27002(id_controle) ON DELETE CASCADE,
    observacoes      TEXT,
    justificativa    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    possui_andamento BOOLEAN     NOT NULL DEFAULT FALSE,
    situacao         VARCHAR(20) NOT NULL
        CHECK (situacao IN ('CONFORME', 'NAO_CONFORME', 'NAO_APLICA'))
);

CREATE TABLE respostas_auditoria_27701 (
    id_resposta27701 SERIAL PRIMARY KEY,
    auditoria_id     INTEGER     NOT NULL REFERENCES auditorias(id_auditoria)    ON DELETE CASCADE,
    controle_id      INTEGER     NOT NULL REFERENCES controles_27701(id_controle) ON DELETE CASCADE,
    observacoes      TEXT,
    justificativa    TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    possui_andamento BOOLEAN     NOT NULL DEFAULT FALSE,
    situacao         VARCHAR(20) NOT NULL
        CHECK (situacao IN ('CONFORME', 'NAO_CONFORME', 'NAO_APLICA'))
);

CREATE TABLE evidencias_27002 (
    id_evidencia          SERIAL PRIMARY KEY,
    resposta_auditoria_id INTEGER      NOT NULL REFERENCES respostas_auditoria_27002(id_resposta27002) ON DELETE CASCADE,
    arquivo               VARCHAR(255) NOT NULL,
    descricao             TEXT         NOT NULL
);

CREATE TABLE evidencias_27701 (
    id_evidencia          SERIAL PRIMARY KEY,
    resposta_auditoria_id INTEGER      NOT NULL REFERENCES respostas_auditoria_27701(id_resposta27701) ON DELETE CASCADE,
    arquivo               VARCHAR(255) NOT NULL,
    descricao             TEXT         NOT NULL
);

-- ------------------------------------------------------------
-- Índices sugeridos
-- ------------------------------------------------------------

CREATE INDEX idx_controles_27002_norma  ON controles_27002(norma_id);
CREATE INDEX idx_controles_27701_norma  ON controles_27701(norma_id);
CREATE INDEX idx_auditorias_empresa     ON auditorias(empresa_id);
CREATE INDEX idx_auditorias_norma       ON auditorias(norma_id);
CREATE INDEX idx_auditorias_auditor     ON auditorias(auditor_id);
CREATE INDEX idx_respostas27002_audit   ON respostas_auditoria_27002(auditoria_id);
CREATE INDEX idx_respostas27002_ctrl    ON respostas_auditoria_27002(controle_id);
CREATE INDEX idx_respostas27701_audit   ON respostas_auditoria_27701(auditoria_id);
CREATE INDEX idx_respostas27701_ctrl    ON respostas_auditoria_27701(controle_id);
CREATE INDEX idx_evidencias27002_resp   ON evidencias_27002(resposta_auditoria_id);
CREATE INDEX idx_evidencias27701_resp   ON evidencias_27701(resposta_auditoria_id);
