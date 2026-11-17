import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { Aviso, Campo } from '../components';
import { mascaraCnpj, mascaraTelefone } from '../masks';

const VAZIO = { nome: '', cnpj: '', endereco: '', telefone: '', email: '', contato: '' };

export default function FornecedoresPage() {
  const [lista, setLista] = useState([]);
  const [form, setForm] = useState(VAZIO);
  const [editandoId, setEditandoId] = useState(null);
  const [erros, setErros] = useState({});
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setLista(await api.listarFornecedores());
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
  };

  async function enviar(ev) {
    ev.preventDefault();
    setEnviando(true);
    setErros({});
    try {
      const resp = editandoId
        ? await api.atualizarFornecedor(editandoId, form)
        : await api.criarFornecedor(form);
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

  function editar(f) {
    setEditandoId(f.id);
    setErros({});
    setForm({
      nome: f.nome,
      cnpj: mascaraCnpj(f.cnpj),
      endereco: f.endereco,
      telefone: mascaraTelefone(f.telefone),
      email: f.email,
      contato: f.contato,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function excluir(f) {
    if (!window.confirm(`Excluir o fornecedor "${f.nome}"? As associações com produtos também serão removidas.`)) return;
    try {
      const resp = await api.excluirFornecedor(f.id);
      setAviso({ tipo: 'sucesso', texto: resp.mensagem });
      if (editandoId === f.id) limpar();
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
          <h2>{editandoId ? 'Editar Fornecedor' : 'Cadastro de Fornecedor'}</h2>
          {editandoId && (
            <button type="button" className="btn btn-secundario" onClick={limpar}>
              Cancelar edição
            </button>
          )}
        </div>

        <form onSubmit={enviar} noValidate>
          <div className="grade">
            <Campo label="Nome da Empresa" obrigatorio erro={erros.nome}>
              <input
                type="text"
                placeholder="Insira o nome da empresa"
                value={form.nome}
                onChange={(e) => alterar('nome', e.target.value)}
              />
            </Campo>

            <Campo label="CNPJ" obrigatorio erro={erros.cnpj}>
              <input
                type="text"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                value={form.cnpj}
                onChange={(e) => alterar('cnpj', mascaraCnpj(e.target.value))}
              />
            </Campo>

            <Campo label="Endereço" obrigatorio erro={erros.endereco}>
              <textarea
                rows={2}
                placeholder="Insira o endereço completo da empresa"
                value={form.endereco}
                onChange={(e) => alterar('endereco', e.target.value)}
              />
            </Campo>

            <Campo label="Telefone" obrigatorio erro={erros.telefone}>
              <input
                type="text"
                inputMode="tel"
                placeholder="(00) 0000-0000"
                value={form.telefone}
                onChange={(e) => alterar('telefone', mascaraTelefone(e.target.value))}
              />
            </Campo>

            <Campo label="E-mail" obrigatorio erro={erros.email}>
              <input
                type="email"
                placeholder="exemplo@fornecedor.com"
                value={form.email}
                onChange={(e) => alterar('email', e.target.value)}
              />
            </Campo>

            <Campo label="Contato Principal" obrigatorio erro={erros.contato}>
              <input
                type="text"
                placeholder="Nome do contato principal"
                value={form.contato}
                onChange={(e) => alterar('contato', e.target.value)}
              />
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
        <h2>Fornecedores cadastrados</h2>
        {lista.length === 0 ? (
          <p className="vazio">Nenhum fornecedor cadastrado ainda.</p>
        ) : (
          <div className="tabela-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CNPJ</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th>Contato</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {lista.map((f) => (
                  <tr key={f.id}>
                    <td>{f.nome}</td>
                    <td>{mascaraCnpj(f.cnpj)}</td>
                    <td>{mascaraTelefone(f.telefone)}</td>
                    <td>{f.email}</td>
                    <td>{f.contato}</td>
                    <td className="col-acoes">
                      <button type="button" className="btn btn-pequeno" onClick={() => editar(f)}>
                        Editar
                      </button>
                      <button type="button" className="btn btn-pequeno btn-perigo" onClick={() => excluir(f)}>
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
