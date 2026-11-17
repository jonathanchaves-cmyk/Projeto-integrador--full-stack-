import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { Aviso, Campo } from '../components';
import { mascaraCnpj } from '../masks';

export default function AssociacaoPage() {
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);

  const [produtoId, setProdutoId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [associados, setAssociados] = useState([]);

  // consulta no sentido inverso (fornecedor -> produtos)
  const [consultaFornecedorId, setConsultaFornecedorId] = useState('');
  const [produtosDoFornecedor, setProdutosDoFornecedor] = useState([]);

  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState(null);

  const produto = produtos.find((p) => String(p.id) === String(produtoId));

  useEffect(() => {
    (async () => {
      try {
        const [p, f] = await Promise.all([api.listarProdutos(), api.listarFornecedores()]);
        setProdutos(p);
        setFornecedores(f);
      } catch (e) {
        setAviso({ tipo: 'erro', texto: e.message });
      }
    })();
  }, []);

  const carregarAssociados = useCallback(async (id) => {
    if (!id) return setAssociados([]);
    try {
      setAssociados(await api.fornecedoresDoProduto(id));
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e.message });
    }
    return undefined;
  }, []);

  useEffect(() => {
    carregarAssociados(produtoId);
    setFornecedorId('');
    setErros({});
  }, [produtoId, carregarAssociados]);

  useEffect(() => {
    (async () => {
      if (!consultaFornecedorId) return setProdutosDoFornecedor([]);
      try {
        setProdutosDoFornecedor(await api.produtosDoFornecedor(consultaFornecedorId));
      } catch (e) {
        setAviso({ tipo: 'erro', texto: e.message });
      }
      return undefined;
    })();
  }, [consultaFornecedorId, associados]); // `associados` muda quando uma associação é criada/removida

  async function associar() {
    setErros({});
    try {
      const resp = await api.associar(produtoId, fornecedorId);
      setAviso({ tipo: 'sucesso', texto: resp.mensagem });
      setFornecedorId('');
      carregarAssociados(produtoId);
    } catch (e) {
      setErros(e.erros || {});
      setAviso({ tipo: 'erro', texto: e.message });
    }
  }

  async function desassociar(f) {
    if (!window.confirm(`Desassociar "${f.nome}" deste produto?`)) return;
    try {
      const resp = await api.desassociar(produtoId, f.id);
      setAviso({ tipo: 'sucesso', texto: resp.mensagem });
      carregarAssociados(produtoId);
    } catch (e) {
      setAviso({ tipo: 'erro', texto: e.message });
    }
  }

  return (
    <section>
      <Aviso aviso={aviso} onFechar={() => setAviso(null)} />

      <div className="cartao">
        <h2>Associação de Fornecedor a Produto</h2>

        <Campo label="Produto">
          <select value={produtoId} onChange={(e) => setProdutoId(e.target.value)}>
            <option value="">Selecione um produto</option>
            {produtos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
                {p.codigoBarras ? ` — ${p.codigoBarras}` : ''}
              </option>
            ))}
          </select>
        </Campo>

        {produto && (
          <>
            <h3>Detalhes do Produto</h3>
            <div className="detalhes">
              <div className="grade">
                <Campo label="Nome do Produto">
                  <input type="text" value={produto.nome} readOnly />
                </Campo>
                <Campo label="Código de Barras">
                  <input type="text" value={produto.codigoBarras || '—'} readOnly />
                </Campo>
                <Campo label="Descrição">
                  <textarea rows={2} value={produto.descricao} readOnly />
                </Campo>
                {produto.imagem && (
                  <Campo label="Imagem do Produto">
                    <img className="miniatura" src={produto.imagem} alt={produto.nome} />
                  </Campo>
                )}
              </div>
            </div>

            <h3>Associar Fornecedor</h3>
            <div className="linha-associar">
              <Campo label="Fornecedor" erro={erros.fornecedorId}>
                <select value={fornecedorId} onChange={(e) => setFornecedorId(e.target.value)}>
                  <option value="">Selecione um fornecedor</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome} — {mascaraCnpj(f.cnpj)}
                    </option>
                  ))}
                </select>
              </Campo>
              <button type="button" className="btn btn-primario" onClick={associar}>
                Associar Fornecedor
              </button>
            </div>

            <h3>Fornecedores Associados</h3>
            {associados.length === 0 ? (
              <p className="vazio">Este produto ainda não tem fornecedores associados.</p>
            ) : (
              <div className="tabela-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nome do Fornecedor</th>
                      <th>CNPJ</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {associados.map((f) => (
                      <tr key={f.id}>
                        <td>{f.nome}</td>
                        <td>{mascaraCnpj(f.cnpj)}</td>
                        <td className="col-acoes">
                          <button type="button" className="btn btn-pequeno btn-perigo" onClick={() => desassociar(f)}>
                            Desassociar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      <div className="cartao">
        <h2>Consultar produtos por fornecedor</h2>
        <Campo label="Fornecedor">
          <select value={consultaFornecedorId} onChange={(e) => setConsultaFornecedorId(e.target.value)}>
            <option value="">Selecione um fornecedor</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome} — {mascaraCnpj(f.cnpj)}
              </option>
            ))}
          </select>
        </Campo>

        {consultaFornecedorId &&
          (produtosDoFornecedor.length === 0 ? (
            <p className="vazio">Este fornecedor ainda não fornece nenhum produto.</p>
          ) : (
            <div className="tabela-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Código de barras</th>
                    <th>Categoria</th>
                    <th>Qtd. em estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosDoFornecedor.map((p) => (
                    <tr key={p.id}>
                      <td>{p.nome}</td>
                      <td>{p.codigoBarras || '—'}</td>
                      <td>{p.categoria}</td>
                      <td>{p.quantidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </div>
    </section>
  );
}
