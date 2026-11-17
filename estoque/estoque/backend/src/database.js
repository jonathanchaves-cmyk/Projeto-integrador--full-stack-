// Banco de dados SQLite usando o módulo nativo do Node.js (node:sqlite).
// Não é necessário instalar nenhum pacote. Requer Node.js 22.13 ou superior.
const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const arquivo = process.env.DB_FILE || path.join(__dirname, '..', 'estoque.db');
const db = new DatabaseSync(arquivo);

db.exec('PRAGMA foreign_keys = ON;');

db.exec(`
  CREATE TABLE IF NOT EXISTS fornecedores (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    nome      TEXT NOT NULL,
    cnpj      TEXT NOT NULL UNIQUE,
    endereco  TEXT NOT NULL,
    telefone  TEXT NOT NULL,
    email     TEXT NOT NULL,
    contato   TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS produtos (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    nome           TEXT NOT NULL,
    codigo_barras  TEXT UNIQUE,
    descricao      TEXT NOT NULL,
    preco          REAL,
    quantidade     INTEGER NOT NULL DEFAULT 0,
    categoria      TEXT NOT NULL,
    data_validade  TEXT,
    imagem         TEXT
  );

  -- Relação muitos-para-muitos entre produtos e fornecedores
  CREATE TABLE IF NOT EXISTS produto_fornecedor (
    produto_id     INTEGER NOT NULL,
    fornecedor_id  INTEGER NOT NULL,
    PRIMARY KEY (produto_id, fornecedor_id),
    FOREIGN KEY (produto_id)    REFERENCES produtos(id)     ON DELETE CASCADE,
    FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id) ON DELETE CASCADE
  );
`);

module.exports = db;
