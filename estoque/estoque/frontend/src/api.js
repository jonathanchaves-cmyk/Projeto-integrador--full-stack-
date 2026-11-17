// Cliente da API do backend.
// A URL pode ser trocada com a variável REACT_APP_API_URL (arquivo .env do frontend).
const BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

async function requisicao(metodo, caminho, corpo) {
  let resposta;
  try {
    resposta = await fetch(BASE + caminho, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    const e = new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
    e.erros = {};
    throw e;
  }

  let dados = null;
  try {
    dados = await resposta.json();
  } catch {
    /* resposta sem corpo */
  }

  if (!resposta.ok) {
    const e = new Error(dados?.erro || 'Erro inesperado.');
    e.status = resposta.status;
    e.erros = dados?.erros || {}; // erros por campo, exibidos ao lado dos campos
    throw e;
  }
  return dados;
}

export const api = {
  // Fornecedores
  listarFornecedores: () => requisicao('GET', '/fornecedores'),
  criarFornecedor: (d) => requisicao('POST', '/fornecedores', d),
  atualizarFornecedor: (id, d) => requisicao('PUT', `/fornecedores/${id}`, d),
  excluirFornecedor: (id) => requisicao('DELETE', `/fornecedores/${id}`),
  produtosDoFornecedor: (id) => requisicao('GET', `/fornecedores/${id}/produtos`),

  // Produtos
  listarProdutos: () => requisicao('GET', '/produtos'),
  criarProduto: (d) => requisicao('POST', '/produtos', d),
  atualizarProduto: (id, d) => requisicao('PUT', `/produtos/${id}`, d),
  excluirProduto: (id) => requisicao('DELETE', `/produtos/${id}`),

  // Associação
  fornecedoresDoProduto: (id) => requisicao('GET', `/produtos/${id}/fornecedores`),
  associar: (produtoId, fornecedorId) =>
    requisicao('POST', `/produtos/${produtoId}/fornecedores`, { fornecedorId }),
  desassociar: (produtoId, fornecedorId) =>
    requisicao('DELETE', `/produtos/${produtoId}/fornecedores/${fornecedorId}`),
};
