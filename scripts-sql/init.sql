\connect starsoft;

-- =====================================================
-- TABELA DE SESSOES
-- =====================================================

CREATE TABLE IF NOT EXISTS sessoes (
    id SERIAL PRIMARY KEY,
    filme VARCHAR(255) NOT NULL,
    data DATE NOT NULL,
    horario TIME NOT NULL,
    sala INTEGER NOT NULL CHECK (sala BETWEEN 1 AND 999),
    preco NUMERIC(10,2) NOT NULL CHECK (preco >= 0),
    assentos INTEGER NOT NULL CHECK (assentos > 0),
    CONSTRAINT uk_sessao_unica UNIQUE (filme, data, horario, sala)
);

INSERT INTO sessoes (filme, data, horario, sala, preco, assentos) VALUES
('Tenet', '2025-02-06', '20:00', 5, 10.00, 30),
('Velozes e Furiosos 3: Desafio em Tóquio', '2025-02-03', '21:00', 1, 5.99, 50),
('A Chegada', '2025-01-31', '14:45', 10, 30.00, 50);

-- =====================================================
-- TABELA DE ASSENTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS assentos (
    id SERIAL PRIMARY KEY,
    sessao_id INTEGER NOT NULL,
    disponiveis INTEGER[] NOT NULL,
    indisponiveis INTEGER[] NOT NULL,
    CONSTRAINT fk_assentos_sessao
        FOREIGN KEY (sessao_id)
        REFERENCES sessoes(id)
        ON DELETE CASCADE
);

INSERT INTO assentos (sessao_id, disponiveis, indisponiveis) VALUES
(
    1,
    ARRAY[
        4,5,6,7,8,9,
        12,13,14,15,16,17,18,19,20,
        21,22,23,24,25,26,27,28,29,30
    ],
    ARRAY[1,2,3,10,11]
),
(
    2,
    ARRAY[
        1,2,3,4,5,6,7,8,9,
        11,12,13,14,15,16,17,18,19,20,
        22,23,24,25,26,27,28,29,
        31,32,33,34,35,36,37,38,39,40,
        41,42,43,44,45,46,47,48,49,50
    ],
    ARRAY[10,21,30]
),
(
    3,
    ARRAY[
        1,2,3,4,5,6,7,8,9,10,
        11,12,13,14,15,16,17,18,19,20,
        21,22,23,24,25,26,27,28,29,30,
        31,32,33,34,35,36,37,38,39,40,
        44,45,46,47,48,49,50
    ],
    ARRAY[41,42,43]
);

-- =====================================================
-- TABELA DE VENDAS
-- =====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS vendas (
    id UUID PRIMARY KEY,
    usuario VARCHAR(255) NOT NULL,
    sessao_id INTEGER NOT NULL,
    assentos INTEGER[] NOT NULL,
    CONSTRAINT fk_vendas_sessao
        FOREIGN KEY (sessao_id)
        REFERENCES sessoes(id)
        ON DELETE RESTRICT
);

INSERT INTO vendas (id, usuario, sessao_id, assentos) VALUES
(uuid_generate_v4(), 'Patrick Neris', 1, ARRAY[1,2,3]),
(uuid_generate_v4(), 'João Pedro',    1, ARRAY[10,11]),
(uuid_generate_v4(), 'Patrick Neris', 2, ARRAY[30]),
(uuid_generate_v4(), 'Lucas Almeida', 2, ARRAY[10]),
(uuid_generate_v4(), 'Mariana Costa', 2, ARRAY[21]),
(uuid_generate_v4(), 'Rafael Lima',   2, ARRAY[22,23]),
(uuid_generate_v4(), 'Ana Souza',     2, ARRAY[24]),
(uuid_generate_v4(), 'Bruno Rocha',   2, ARRAY[25,26]),
(uuid_generate_v4(), 'Camila Torres', 3, ARRAY[41]),
(uuid_generate_v4(), 'Diego Martins', 3, ARRAY[42]),
(uuid_generate_v4(), 'Fernanda Pires',3, ARRAY[43]);

