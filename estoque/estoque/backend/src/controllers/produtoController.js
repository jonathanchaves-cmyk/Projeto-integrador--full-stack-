// Controlador de Produto: CRUD completo.
const db = require('../database');
const { validarProduto } = require('../validators');
const { HttpError, parseId } = require('../utils');

const paraApi = (r) => ({
  id: r.id,
  nome: r.nome,
  codigoBarras: r.codigo_barras,
  descricao: r.descricao,
  preco: r.preco,
  quantidade: r.quantidade,
  categoria: r.categoria,
  dataValidade: r.data_validade,
  imagem: r.imagem,
});

function buscar(id) {
  const linha = db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
  if (!linha) throw new HttpError(404, 'Produto não encontrado!');
  return linha;
}

function codigoEmUso(codigo, ignorarId = 0) {
  if (!codigo) return false; // código de barras é opcional
  return !!db.prepare('SELECT 1 FROM produtos WHERE codigo_barras = ? AND id <> ?').get(codigo, ignorarId);
}

const MSG_CODIGO_DUPLICADO = 'Produto com este código de barras já está cadastrado!';

module.exports = {
  listar() {
    const linhas = db.prepare('SELECT * FROM produtos ORDER BY nome COLLATE NOCASE').all();
    return { status: 200, body: linhas.map(paraApi) };
  },

  obter({ params }) {
    return { status: 200, body: paraApi(buscar(parseId(params.id))) };
  },

  criar({ body }) {
    const { dados, erros } = validarProduto(body);
    if (Object.keys(erros).length) throw new HttpError(400, 'Dados inválidos.', erros);

    // 2º cenário: código de barras já existente
    if (codigoEmUso(dados.codigoBarras))
      throw new HttpError(409, MSG_CODIGO_DUPLICADO, { codigoBarras: MSG_CODIGO_DUPLICADO });

    const r = db
      .prepare(
        `INSERT INTO produtos (nome, codigo_barras, descricao, preco, quantidade, categoria, data_validade, imagem)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        dados.nome,
        dados.codigoBarras,
        dados.descricao,
        dados.preco,
        dados.quantidade,
        dados.categoria,
        dados.dataValidade,
        dados.imagem
      );

    return {
      status: 201,
      body: { mensagem: 'Produto cadastrado com sucesso!', produto: paraApi(buscar(Number(r.lastInsertRowid))) },
    };
  },

  atualizar({ params, body }) {
    const id = parseId(params.id);
    buscar(id);
    const { dados, erros } = validarProduto(body);
    if (Object.keys(erros).length) throw new HttpError(400, 'Dados inválidos.', erros);
    if (codigoEmUso(dados.codigoBarras, id))
      throw new HttpError(409, MSG_CODIGO_DUPLICADO, { codigoBarras: MSG_CODIGO_DUPLICADO });

    db.prepare(
      `UPDATE produtos
          SET nome = ?, codigo_barras = ?, descricao = ?, preco = ?, quantidade = ?,
              categoria = ?, data_validade = ?, imagem = ?
        WHERE id = ?`
    ).run(
      dados.nome,
      dados.codigoBarras,
      dados.descricao,
      dados.preco,
      dados.quantidade,
      dados.categoria,
      dados.dataValidade,
      dados.imagem,
      id
    );

    return { status: 200, body: { mensagem: 'Produto atualizado com sucesso!', produto: paraApi(buscar(id)) } };
  },

  remover({ params }) {
    const id = parseId(params.id);
    buscar(id);
    db.prepare('DELETE FROM produtos WHERE id = ?').run(id); // associações saem em cascata
    return { status: 200, body: { mensagem: 'Produto excluído com sucesso!' } };
  },
};
