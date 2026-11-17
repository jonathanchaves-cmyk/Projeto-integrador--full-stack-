// Roteador mínimo (sem dependências): casa método + caminho com um controlador.
const fornecedor = require('./controllers/fornecedorController');
const produto = require('./controllers/produtoController');
const associacao = require('./controllers/associacaoController');

const rotas = [];

function rota(metodo, padrao, handler) {
  const chaves = [];
  const regex = new RegExp(
    '^' +
      padrao.replace(/:([a-zA-Z]+)/g, (_, nome) => {
        chaves.push(nome);
        return '([^/]+)';
      }) +
      '/?$'
  );
  rotas.push({ metodo, regex, chaves, handler });
}

// Fornecedores
rota('GET', '/fornecedores', fornecedor.listar);
rota('POST', '/fornecedores', fornecedor.criar);
rota('GET', '/fornecedores/:id', fornecedor.obter);
rota('PUT', '/fornecedores/:id', fornecedor.atualizar);
rota('DELETE', '/fornecedores/:id', fornecedor.remover);
rota('GET', '/fornecedores/:id/produtos', associacao.produtosDoFornecedor);

// Produtos
rota('GET', '/produtos', produto.listar);
rota('POST', '/produtos', produto.criar);
rota('GET', '/produtos/:id', produto.obter);
rota('PUT', '/produtos/:id', produto.atualizar);
rota('DELETE', '/produtos/:id', produto.remover);

// Associação Produto/Fornecedor
rota('GET', '/produtos/:id/fornecedores', associacao.fornecedoresDoProduto);
rota('POST', '/produtos/:id/fornecedores', associacao.associar);
rota('DELETE', '/produtos/:id/fornecedores/:fornecedorId', associacao.desassociar);

function encontrar(metodo, caminho) {
  let caminhoExiste = false;
  for (const r of rotas) {
    const m = r.regex.exec(caminho);
    if (!m) continue;
    caminhoExiste = true;
    if (r.metodo !== metodo) continue;
    const params = {};
    r.chaves.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
    return { handler: r.handler, params };
  }
  return { naoPermitido: caminhoExiste };
}

module.exports = { encontrar };
