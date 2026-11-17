import React, { useState } from 'react';
import ProdutosPage from './pages/ProdutosPage';
import FornecedoresPage from './pages/FornecedoresPage';
import AssociacaoPage from './pages/AssociacaoPage';

const ABAS = [
  { id: 'produtos', rotulo: 'Produtos', Pagina: ProdutosPage },
  { id: 'fornecedores', rotulo: 'Fornecedores', Pagina: FornecedoresPage },
  { id: 'associacao', rotulo: 'Produto / Fornecedor', Pagina: AssociacaoPage },
];

export default function App() {
  const [aba, setAba] = useState('produtos');
  const { Pagina } = ABAS.find((a) => a.id === aba);

  return (
    <div className="app">
      <header className="topo">
        <h1>Controle de Estoque</h1>
        <nav>
          {ABAS.map((a) => (
            <button
              key={a.id}
              type="button"
              className={`aba${a.id === aba ? ' aba-ativa' : ''}`}
              onClick={() => setAba(a.id)}
            >
              {a.rotulo}
            </button>
          ))}
        </nav>
      </header>
      <main className="conteudo">
        {/* key força remontar a página ao trocar de aba, recarregando os dados */}
        <Pagina key={aba} />
      </main>
    </div>
  );
}
