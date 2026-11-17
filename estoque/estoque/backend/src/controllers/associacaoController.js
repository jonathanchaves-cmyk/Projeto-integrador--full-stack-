// Controlador de Associação Produto/Fornecedor (relação muitos-para-muitos).
const db = require('../database');
const { HttpError, parseId } = require('../utils');

function garantirProduto(id) {
  if (!db.prepare('SELECT 1 FROM produtos WHERE id = ?').get(id))
    throw new HttpError(404, 'Produto não encontrado!');
}

function garantirFornecedor(id) {
  if (!db.prepare('SELECT 1 FROM fornecedores WHERE id = ?').get(id))
    throw new HttpError(404, 'Fornecedor não encontrado!');
}

function jaAssociado(produtoId, fornecedorId) {
  return !!db
    .prepare('SELECT 1 FROM produto_fornecedor WHERE produto_id = ? AND fornecedor_id = ?')
    .get(produtoId, fornecedorId);
}

module.exports = {
  // POST /produtos/:id/fornecedores   { "fornecedorId": 1 }
  associar({ params, body }) {
    const produtoId = parseId(params.id);
    garantirProduto(produtoId);

    if (body.fornecedorId === undefined || body.fornecedorId === null || body.fornecedorId === '')
      throw new HttpError(400, 'Dados inválidos.', { fornecedorId: 'Selecione um fornecedor.' });
    const fornecedorId = parseId(body.fornecedorId);
    garantirFornecedor(fornecedorId);

    // 2º cenário: fornecedor já associado
    if (jaAssociado(produtoId, fornecedorId)) {
      const msg = 'Fornecedor já está associado a este produto!';
      throw new HttpError(409, msg, { fornecedorId: msg });
    }

    db.prepare('INSERT INTO produto_fornecedor (produto_id, fornecedor_id) VALUES (?, ?)').run(
      produtoId,
      fornecedorId
    );
    return { status: 201, body: { mensagem: 'Fornecedor associado com sucesso ao produto!' } };
  },

  // DELETE /produtos/:id/fornecedores/:fornecedorId
  desassociar({ params }) {
    const produtoId = parseId(params.id);
    const fornecedorId = parseId(params.fornecedorId);
    garantirProduto(produtoId);
    garantirFornecedor(fornecedorId);

    if (!jaAssociado(produtoId, fornecedorId))
      throw new HttpError(404, 'Este fornecedor não está associado ao produto!');

    db.prepare('DELETE FROM produto_fornecedor WHERE produto_id = ? AND fornecedor_id = ?').run(
      produtoId,
      fornecedorId
    );
    return { status: 200, body: { mensagem: 'Fornecedor desassociado com sucesso!' } };
  },

  // GET /produtos/:id/fornecedores
  fornecedoresDoProduto({ params }) {
    const produtoId = parseId(params.id);
    garantirProduto(produtoId);
    const linhas = db
      .prepare(
        `SELECT f.id, f.nome, f.cnpj, f.endereco, f.telefone, f.email, f.contato
           FROM fornecedores f
           JOIN produto_fornecedor pf ON pf.fornecedor_id = f.id
          WHERE pf.produto_id = ?
          ORDER BY f.nome COLLATE NOCASE`
      )
      .all(produtoId);
    return { status: 200, body: linhas.map((l) => ({ ...l })) };
  },

  // GET /fornecedores/:id/produtos
  produtosDoFornecedor({ params }) {
    const fornecedorId = parseId(params.id);
    garantirFornecedor(fornecedorId);
    const linhas = db
      .prepare(
        `SELECT p.id, p.nome, p.codigo_barras AS codigoBarras, p.descricao, p.categoria, p.quantidade
           FROM produtos p
           JOIN produto_fornecedor pf ON pf.produto_id = p.id
          WHERE pf.fornecedor_id = ?
          ORDER BY p.nome COLLATE NOCASE`
      )
      .all(fornecedorId);
    return { status: 200, body: linhas.map((l) => ({ ...l })) };
  },
};
