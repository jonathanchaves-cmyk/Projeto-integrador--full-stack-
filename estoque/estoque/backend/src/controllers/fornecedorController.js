// Controlador de Fornecedor: CRUD completo.
const db = require('../database');
const { validarFornecedor } = require('../validators');
const { HttpError, parseId } = require('../utils');

const paraApi = (r) => ({
  id: r.id,
  nome: r.nome,
  cnpj: r.cnpj,
  endereco: r.endereco,
  telefone: r.telefone,
  email: r.email,
  contato: r.contato,
});

function buscar(id) {
  const linha = db.prepare('SELECT * FROM fornecedores WHERE id = ?').get(id);
  if (!linha) throw new HttpError(404, 'Fornecedor não encontrado!');
  return linha;
}

function cnpjEmUso(cnpj, ignorarId = 0) {
  return !!db.prepare('SELECT 1 FROM fornecedores WHERE cnpj = ? AND id <> ?').get(cnpj, ignorarId);
}

const MSG_CNPJ_DUPLICADO = 'Fornecedor com esse CNPJ já está cadastrado!';

module.exports = {
  listar() {
    const linhas = db.prepare('SELECT * FROM fornecedores ORDER BY nome COLLATE NOCASE').all();
    return { status: 200, body: linhas.map(paraApi) };
  },

  obter({ params }) {
    return { status: 200, body: paraApi(buscar(parseId(params.id))) };
  },

  criar({ body }) {
    const { dados, erros } = validarFornecedor(body);
    if (Object.keys(erros).length) throw new HttpError(400, 'Dados inválidos.', erros);

    // 2º cenário: CNPJ já existente
    if (cnpjEmUso(dados.cnpj)) throw new HttpError(409, MSG_CNPJ_DUPLICADO, { cnpj: MSG_CNPJ_DUPLICADO });

    const r = db
      .prepare(
        `INSERT INTO fornecedores (nome, cnpj, endereco, telefone, email, contato)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(dados.nome, dados.cnpj, dados.endereco, dados.telefone, dados.email, dados.contato);

    return {
      status: 201,
      body: {
        mensagem: 'Fornecedor cadastrado com sucesso!',
        fornecedor: paraApi(buscar(Number(r.lastInsertRowid))),
      },
    };
  },

  atualizar({ params, body }) {
    const id = parseId(params.id);
    buscar(id);
    const { dados, erros } = validarFornecedor(body);
    if (Object.keys(erros).length) throw new HttpError(400, 'Dados inválidos.', erros);
    if (cnpjEmUso(dados.cnpj, id)) throw new HttpError(409, MSG_CNPJ_DUPLICADO, { cnpj: MSG_CNPJ_DUPLICADO });

    db.prepare(
      `UPDATE fornecedores
          SET nome = ?, cnpj = ?, endereco = ?, telefone = ?, email = ?, contato = ?
        WHERE id = ?`
    ).run(dados.nome, dados.cnpj, dados.endereco, dados.telefone, dados.email, dados.contato, id);

    return {
      status: 200,
      body: { mensagem: 'Fornecedor atualizado com sucesso!', fornecedor: paraApi(buscar(id)) },
    };
  },

  remover({ params }) {
    const id = parseId(params.id);
    buscar(id);
    db.prepare('DELETE FROM fornecedores WHERE id = ?').run(id); // associações saem em cascata
    return { status: 200, body: { mensagem: 'Fornecedor excluído com sucesso!' } };
  },
};
