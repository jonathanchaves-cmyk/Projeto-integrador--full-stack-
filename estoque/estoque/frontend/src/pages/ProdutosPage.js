import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { Aviso, Campo } from '../components';
import { formatarData, formatarPreco, somenteDigitos } from '../masks';

const CATEGORIAS = ['Eletrônicos', 'Alimentos', 'Vestuário', 'Higiene e Limpeza', 'Móveis', 'Livros'];
const OUTRO = 'Outro';
const LIMITE_IMAGEM = 2 * 1024 * 1024; // 2 MB

const VAZIO = {
  nome: '',
  codigoBarras: '',
  descricao: '',
  quantidade: '',
  preco: '',
  categoria: '',
  categoriaOutro: '',
  dataValidade: '',
  imagem: '',
};

export default function ProdutosPage() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [inputArquivo, setInputArquivo] = useState(0); // força limpar o <input type="file">

  const carregar = useCallback(async () => {
    try {
      setLista(await api.listarProdutos());
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e.message });
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const alterar = (campo, valor) => {
    setForm((f) => ({ ...f, [campo]: valor }));
    setErros((e) => ({ ...e, [campo]: undefined }));
  };

  const limpar = () => {
    setForm(VAZIO);
    setEditandoId(null);
    setErros({});
    setInputArquivo((n) => n + 1);
  };

  function escolherImagem(ev) {
    const arquivo = ev.target.files[0];
    if (!arquivo) return alterar('imagem', '');
    if (arquivo.size > LIMITE_IMAGEM) {
      setErros((e) => ({ ...e, imagem: 'A imagem deve ter no máximo 2 MB.' }));
      ev.target.value = '';
      return undefined;
    }
    const leitor = new FileReader();
    leitor.onload = () => alterar('imagem', leitor.result);
    leitor.readAsDataURL(arquivo);
    return undefined;
  }

  async function enviar(ev) {
    ev.preventDefault();
    setEnviando(true);
    setErros({});

    const payload = {
      nome: form.nome,
      codigoBarras: form.codigoBarras,
      descricao: form.descricao,
      quantidade: form.quantidade,
      preco: form.preco,
      categoria: form.categoria === OUTRO ? form.categoriaOutro : form.categoria,
      dataValidade: form.dataValidade,
      imagem: form.imagem,
    };

    try {
      const resp = editandoId ? await api.atualizarProduto(editandoId, payload) : await api.criarProduto(payload);
      setAviso({ tipo: 'sucesso', texto: resp.mensagem });
      limpar();
      carregar();
    } catch (e) {
      setErros(e.erros || {});
      setAviso({ tipo: 'erro', texto: e.message });
    } finally {
      setEnviando(false);
    }
  }

  function editar(p) {
    const personalizada = p.categoria && !CATEGORIAS.includes(p.categoria);
    setEditandoId(p.id);
    setErros({});
    setInputArquivo((n) => n + 1);
    setForm({
      nome: p.nome,
      codigoBarras: p.codigoBarras || '',
      descricao: p.descricao,
      quantidade: p.quantidade ?? '',
      preco: p.preco ?? '',
      categoria: personalizada ? OUTRO : p.categoria,
      categoriaOutro: personalizada ? p.categoria : '',
      dataValidade: p.dataValidade || '',
      imagem: p.imagem || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function excluir(p) {
    if (!window.confirm(`Excluir o produto "${p.nome}"? As associações com fornecedores também serão removidas.`)) return;
    try {
      const resp = await api.excluirProduto(p.id);
      setAviso({ tipo: 'sucesso', texto: resp.mensagem });
      if (editandoId === p.id) limpar();
      carregar();
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e.message });
    }
  }

  return (
    <section>
      <Aviso aviso={aviso} onFechar={() => setAviso(null)} />

      <div className="cartao">
        <div className="cartao-cabecalho">
          <h2>{editandoId ? 'Editar Produto' : 'Cadastro de Produto'}</h2>
          {editandoId && (
            <button type="button" className="btn btn-secundario" onClick={limpar}>
              Cancelar edição
            </button>
          )}
        </div>

        <form onSubmit={enviar} noValidate>
          <div className="grade">
            <Campo label="Nome do Produto" obrigatorio erro={erros.nome}>
              <input
                type="text"
                placeholder="Insira o nome do produto"
                value={form.nome}
                onChange={(e) => alterar('nome', e.target.value)}
              />
            </Campo>

            <Campo label="Código de Barras" erro={erros.codigoBarras}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Insira o código de barras"
                value={form.codigoBarras}
                onChange={(e) => alterar('codigoBarras', somenteDigitos(e.target.value).slice(0, 14))}
              />
            </Campo>

            <Campo label="Descrição" obrigatorio erro={erros.descricao}>
              <textarea
                rows={3}
                placeholder="Descreva brevemente o produto"
                value={form.descricao}
                onChange={(e) => alterar('descricao', e.target.value)}
              />
            </Campo>

            <div>
              <Campo label="Quantidade em Estoque" erro={erros.quantidade}>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Quantidade disponível"
                  value={form.quantidade}
                  onChange={(e) => alterar('quantidade', somenteDigitos(e.target.value))}
                />
              </Campo>
              <Campo label="Preço (R$)" erro={erros.preco}>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={form.preco}
                  onChange={(e) => alterar('preco', e.target.value.replace(/[^\d.,]/g, ''))}
                />
              </Campo>
            </div>

            <Campo label="Categoria" obrigatorio erro={erros.categoria}>
              <select value={form.categoria} onChange={(e) => alterar('categoria', e.target.value)}>
                <option value="">Selecione uma categoria</option>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value={OUTRO}>{OUTRO}</option>
              </select>
              {form.categoria === OUTRO && (
                <input
                  type="text"
                  className="espaco-topo"
                  placeholder="Especifique a categoria"
                  value={form.categoriaOutro}
                  onChange={(e) => alterar('categoriaOutro', e.target.value)}
                />
              )}
            </Campo>

            <Campo label="Data de Validade (se aplicável)" erro={erros.dataValidade}>
              <input
                type="date"
                title="Selecione a data de validade"
                value={form.dataValidade}
                onChange={(e) => alterar('dataValidade', e.target.value)}
              />
            </Campo>

            <Campo label="Imagem do Produto (se aplicável)" erro={erros.imagem}>
              <input
                key={inputArquivo}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={escolherImagem}
              />
              {form.imagem && <img className="miniatura espaco-topo" src={form.imagem} alt="Pré-visualização" />}
            </Campo>
          </div>

          <div className="acoes">
            <button type="submit" className="btn btn-primario" disabled={enviando}>
              {editandoId ? 'Salvar alterações' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </div>

      <div className="cartao">
        <h2>Produtos cadastrados</h2>
        {lista.length === 0 ? (
          <p className="vazio">Nenhum produto cadastrado ainda.</p>
        ) : (
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th />
                  <th>Nome</th>
                  <th>Código de barras</th>
                  <th>Categoria</th>
                  <th>Qtd.</th>
                  <th>Preço</th>
                  <th>Validade</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.id}>
                    <td>{p.imagem ? <img className="miniatura-tabela" src={p.imagem} alt="" /> : null}</td>
                    <td>
                      <strong>{p.nome}</strong>
                      <div className="sub">{p.descricao}</div>
                    </td>
                    <td>{p.codigoBarras || '—'}</td>
                    <td>{p.categoria}</td>
                    <td>{p.quantidade}</td>
                    <td>{formatarPreco(p.preco)}</td>
                    <td>{formatarData(p.dataValidade)}</td>
                    <td className="col-acoes">
                      <button type="button" className="btn btn-pequeno" onClick={() => editar(p)}>
                        Editar
                      </button>
                      <button type="button" className="btn btn-pequeno btn-perigo" onClick={() => excluir(p)}>
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
