// Validações de fornecedor e produto.
// Cada função devolve { dados, erros }. Se `erros` tiver chaves, o cadastro é recusado
// e as mensagens são exibidas ao lado dos campos no frontend.

const somenteDigitos = (v) => String(v ?? '').replace(/\D/g, '');
const texto = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim());

// Validação real de CNPJ (dígitos verificadores)
function cnpjValido(valor) {
  const cnpj = somenteDigitos(valor);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

  const calcular = (base, pesos) => {
    const soma = pesos.reduce((acc, peso, i) => acc + Number(base[i]) * peso, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  const d1 = calcular(cnpj, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const d2 = calcular(cnpj, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13]);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validarFornecedor(body = {}) {
  const erros = {};
  const dados = {
    nome: texto(body.nome),
    cnpj: somenteDigitos(body.cnpj),
    endereco: texto(body.endereco),
    telefone: somenteDigitos(body.telefone),
    email: texto(body.email).toLowerCase(),
    contato: texto(body.contato),
  };

  if (!dados.nome) erros.nome = 'O nome da empresa é obrigatório.';
  else if (dados.nome.length > 150) erros.nome = 'O nome deve ter no máximo 150 caracteres.';

  if (!dados.cnpj) erros.cnpj = 'O CNPJ é obrigatório.';
  else if (!cnpjValido(dados.cnpj)) erros.cnpj = 'CNPJ inválido.';

  if (!dados.endereco) erros.endereco = 'O endereço é obrigatório.';

  if (!dados.telefone) erros.telefone = 'O telefone é obrigatório.';
  else if (dados.telefone.length < 10 || dados.telefone.length > 11)
    erros.telefone = 'Telefone inválido. Use o formato (00) 0000-0000.';

  if (!dados.email) erros.email = 'O e-mail é obrigatório.';
  else if (!EMAIL_RE.test(dados.email)) erros.email = 'E-mail inválido.';

  if (!dados.contato) erros.contato = 'O contato principal é obrigatório.';

  return { dados, erros };
}

function dataValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const d = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valor;
}

function validarProduto(body = {}) {
  const erros = {};
  const dados = {
    nome: texto(body.nome),
    codigoBarras: somenteDigitos(body.codigoBarras) || null,
    descricao: texto(body.descricao),
    categoria: texto(body.categoria),
    dataValidade: texto(body.dataValidade) || null,
    imagem: body.imagem ? String(body.imagem) : null,
    quantidade: 0,
    preco: null,
  };

  if (!dados.nome) erros.nome = 'O nome do produto é obrigatório.';
  else if (dados.nome.length > 150) erros.nome = 'O nome deve ter no máximo 150 caracteres.';

  if (!dados.descricao) erros.descricao = 'A descrição é obrigatória.';

  if (!dados.categoria) erros.categoria = 'A categoria é obrigatória.';
  else if (dados.categoria.length > 60) erros.categoria = 'A categoria deve ter no máximo 60 caracteres.';

  // Código de barras: opcional, mas se informado deve ser numérico (EAN-8 a ITF-14)
  if (body.codigoBarras && String(body.codigoBarras).trim() !== '') {
    if (!/^\d+$/.test(String(body.codigoBarras).trim()))
      erros.codigoBarras = 'O código de barras deve conter apenas números.';
    else if (dados.codigoBarras.length < 8 || dados.codigoBarras.length > 14)
      erros.codigoBarras = 'O código de barras deve ter entre 8 e 14 dígitos.';
  }

  // Quantidade em estoque: opcional (padrão 0), inteiro >= 0
  if (body.quantidade !== undefined && body.quantidade !== null && body.quantidade !== '') {
    const q = Number(body.quantidade);
    if (!Number.isInteger(q) || q < 0) erros.quantidade = 'A quantidade deve ser um número inteiro maior ou igual a zero.';
    else dados.quantidade = q;
  }

  // Preço: opcional, número >= 0
  if (body.preco !== undefined && body.preco !== null && body.preco !== '') {
    const p = Number(String(body.preco).replace(',', '.'));
    if (!Number.isFinite(p) || p < 0) erros.preco = 'O preço deve ser um número maior ou igual a zero.';
    else dados.preco = p;
  }

  if (dados.dataValidade && !dataValida(dados.dataValidade))
    erros.dataValidade = 'Data de validade inválida.';

  if (dados.imagem && !/^data:image\/(png|jpe?g|gif|webp);base64,/.test(dados.imagem))
    erros.imagem = 'A imagem deve ser PNG, JPG, GIF ou WEBP.';

  return { dados, erros };
}

module.exports = { validarFornecedor, validarProduto, cnpjValido };
