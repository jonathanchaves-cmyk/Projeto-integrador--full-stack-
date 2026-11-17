// Testes de integração da API (usam banco SQLite em memória).
process.env.DB_FILE = ':memory:';

const test = require('node:test');
const assert = require('node:assert/strict');
const server = require('../app');

let base;
test.before(async () => {
  await new Promise((ok) => server.listen(0, ok));
  base = `http://localhost:${server.address().port}`;
});
test.after(() => server.close());

async function chamar(metodo, caminho, corpo) {
  const r = await fetch(base + caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const texto = await r.text();
  return { status: r.status, body: texto ? JSON.parse(texto) : null };
}

const fornecedorValido = {
  nome: 'Distribuidora Alfa',
  cnpj: '11.222.333/0001-81',
  endereco: 'Rua das Flores, 100, Brasília - DF',
  telefone: '(61) 3333-4444',
  email: 'contato@alfa.com',
  contato: 'Maria Silva',
};

const produtoValido = {
  nome: 'Teclado Mecânico',
  codigoBarras: '7891234567895',
  descricao: 'Teclado mecânico ABNT2',
  quantidade: 10,
  preco: 199.9,
  categoria: 'Eletrônicos',
};

// ---------- Fornecedor ----------
test('Fornecedor 1º cenário: cadastra com sucesso', async () => {
  const r = await chamar('POST', '/fornecedores', fornecedorValido);
  assert.equal(r.status, 201);
  assert.equal(r.body.mensagem, 'Fornecedor cadastrado com sucesso!');
  assert.equal(r.body.fornecedor.cnpj, '11222333000181');
});

test('Fornecedor 2º cenário: CNPJ já existente', async () => {
  const r = await chamar('POST', '/fornecedores', { ...fornecedorValido, nome: 'Outra' });
  assert.equal(r.status, 409);
  assert.equal(r.body.erro, 'Fornecedor com esse CNPJ já está cadastrado!');
  assert.equal(r.body.erros.cnpj, 'Fornecedor com esse CNPJ já está cadastrado!');
});

test('Fornecedor 3º cenário: informações inválidas / campos em branco', async () => {
  const r = await chamar('POST', '/fornecedores', { nome: '', cnpj: '123', email: 'x', telefone: '1' });
  assert.equal(r.status, 400);
  for (const campo of ['nome', 'cnpj', 'endereco', 'telefone', 'email', 'contato'])
    assert.ok(r.body.erros[campo], `esperava erro em ${campo}`);
});

test('Fornecedor: CNPJ com dígito verificador errado é recusado', async () => {
  const r = await chamar('POST', '/fornecedores', { ...fornecedorValido, cnpj: '11.222.333/0001-82' });
  assert.equal(r.status, 400);
  assert.equal(r.body.erros.cnpj, 'CNPJ inválido.');
});

test('Fornecedor: listar, obter, atualizar e excluir', async () => {
  const lista = await chamar('GET', '/fornecedores');
  assert.equal(lista.body.length, 1);
  const id = lista.body[0].id;

  const upd = await chamar('PUT', `/fornecedores/${id}`, { ...fornecedorValido, nome: 'Alfa Atualizada' });
  assert.equal(upd.status, 200);
  assert.equal(upd.body.fornecedor.nome, 'Alfa Atualizada');

  const del = await chamar('DELETE', `/fornecedores/${id}`);
  assert.equal(del.status, 200);
  assert.equal((await chamar('GET', `/fornecedores/${id}`)).status, 404);
});

// ---------- Produto ----------
test('Produto 1º cenário: cadastra com sucesso', async () => {
  const r = await chamar('POST', '/produtos', produtoValido);
  assert.equal(r.status, 201);
  assert.equal(r.body.mensagem, 'Produto cadastrado com sucesso!');
});

test('Produto 2º cenário: código de barras já existente', async () => {
  const r = await chamar('POST', '/produtos', { ...produtoValido, nome: 'Outro' });
  assert.equal(r.status, 409);
  assert.equal(r.body.erro, 'Produto com este código de barras já está cadastrado!');
  assert.ok(r.body.erros.codigoBarras);
});

test('Produto 3º cenário: informações inválidas / campos em branco', async () => {
  const r = await chamar('POST', '/produtos', {
    nome: '',
    descricao: '',
    categoria: '',
    codigoBarras: 'abc',
    quantidade: -3,
    dataValidade: '31/12/2030',
  });
  assert.equal(r.status, 400);
  for (const campo of ['nome', 'descricao', 'categoria', 'codigoBarras', 'quantidade', 'dataValidade'])
    assert.ok(r.body.erros[campo], `esperava erro em ${campo}`);
});

test('Produto: código de barras é opcional (vários produtos sem código)', async () => {
  const base = { nome: 'Caderno', descricao: 'Caderno 100 folhas', categoria: 'Outro' };
  assert.equal((await chamar('POST', '/produtos', base)).status, 201);
  assert.equal((await chamar('POST', '/produtos', { ...base, nome: 'Caderno 2' })).status, 201);
});

// ---------- Associação ----------
test('Associação: associar, duplicar, consultar nos dois sentidos e desassociar', async () => {
  const f = (await chamar('POST', '/fornecedores', { ...fornecedorValido, cnpj: '11222333000181' })).body.fornecedor;
  const p = (await chamar('GET', '/produtos')).body.find((x) => x.codigoBarras === produtoValido.codigoBarras);

  // 1º cenário
  const ok = await chamar('POST', `/produtos/${p.id}/fornecedores`, { fornecedorId: f.id });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.mensagem, 'Fornecedor associado com sucesso ao produto!');

  // 2º cenário
  const dup = await chamar('POST', `/produtos/${p.id}/fornecedores`, { fornecedorId: f.id });
  assert.equal(dup.status, 409);
  assert.equal(dup.body.erro, 'Fornecedor já está associado a este produto!');

  // consultas
  const doProduto = await chamar('GET', `/produtos/${p.id}/fornecedores`);
  assert.equal(doProduto.body.length, 1);
  assert.equal(doProduto.body[0].cnpj, '11222333000181');
  const doFornecedor = await chamar('GET', `/fornecedores/${f.id}/produtos`);
  assert.equal(doFornecedor.body[0].nome, 'Teclado Mecânico');

  // 3º cenário
  const del = await chamar('DELETE', `/produtos/${p.id}/fornecedores/${f.id}`);
  assert.equal(del.status, 200);
  assert.equal(del.body.mensagem, 'Fornecedor desassociado com sucesso!');
  assert.equal((await chamar('GET', `/produtos/${p.id}/fornecedores`)).body.length, 0);
});

test('Associação: excluir fornecedor remove a associação em cascata', async () => {
  const f = (await chamar('GET', '/fornecedores')).body[0];
  const p = (await chamar('GET', '/produtos')).body[0];
  await chamar('POST', `/produtos/${p.id}/fornecedores`, { fornecedorId: f.id });
  await chamar('DELETE', `/fornecedores/${f.id}`);
  assert.equal((await chamar('GET', `/produtos/${p.id}/fornecedores`)).body.length, 0);
});

test('Rotas inexistentes e métodos inválidos', async () => {
  assert.equal((await chamar('GET', '/nada')).status, 404);
  assert.equal((await chamar('DELETE', '/produtos')).status, 405);
  assert.equal((await chamar('GET', '/produtos/abc')).status, 400);
  assert.equal((await chamar('GET', '/produtos/9999')).status, 404);
});
