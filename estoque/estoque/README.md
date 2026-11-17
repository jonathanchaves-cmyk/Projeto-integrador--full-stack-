FACULDADE GRAN (https://faculdade.grancursosonline.com.br/)

Projeto Disciplina Projeto Integrador

# Sistema de Controle de Estoque

Aplicação Full Stack para cadastro de **fornecedores**, **produtos** e **associação** entre eles (relação muitos-para-muitos).

- **Backend:** Node.js (módulo `http` nativo) + SQLite (módulo nativo `node:sqlite`), sem dependências externas.
- **Frontend:** React.js, com 3 páginas (Produtos, Fornecedores, Associação Produto/Fornecedor).

```
estoque/
├── backend/
│   ├── app.js                         # servidor HTTP (porta 3001)
│   ├── src/
│   │   ├── database.js                # criação do banco e das tabelas
│   │   ├── router.js                  # rotas
│   │   ├── validators.js              # validações (inclui CNPJ com dígito verificador)
│   │   ├── utils.js
│   │   └── controllers/
│   │       ├── produtoController.js
│   │       ├── fornecedorController.js
│   │       └── associacaoController.js
│   └── test/api.test.js               # testes automatizados dos cenários da Fase 1
└── frontend/
    ├── public/index.html
    └── src/
        ├── App.js, App.css, index.js
        ├── api.js                     # chamadas ao backend
        ├── masks.js                   # máscaras de CNPJ e telefone
        ├── components.js              # Campo (com erro) e Aviso (mensagens)
        └── pages/
            ├── ProdutosPage.js
            ├── FornecedoresPage.js
            └── AssociacaoPage.js
```

## Como executar

### Pré-requisitos
- [Node.js](https://nodejs.org/en) **versão 22.13 ou superior** (LTS). O backend usa o SQLite embutido do Node, que existe a partir da versão 22.
- Visual Studio Code e Insomnia (ou Postman) para testar.

### Backend
```bash
cd backend
npm start          # http://localhost:3001
npm test           # roda os testes automatizados
```
O banco `estoque.db` é criado automaticamente na pasta `backend`.

> Se aparecer o aviso `ExperimentalWarning: SQLite is an experimental feature`, é normal: o módulo `node:sqlite` ainda é marcado como experimental pelo Node.

### Frontend
Em outro terminal:
```bash
cd frontend
npm install
npm start          # http://localhost:3000
```
O frontend acessa o backend em `http://localhost:3001`. Para mudar, crie `frontend/.env` com `REACT_APP_API_URL=http://localhost:OUTRA_PORTA`.

## API (para testar no Insomnia)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/fornecedores` | Lista fornecedores |
| POST | `/fornecedores` | Cadastra fornecedor |
| GET | `/fornecedores/:id` | Busca um fornecedor |
| PUT | `/fornecedores/:id` | Atualiza fornecedor |
| DELETE | `/fornecedores/:id` | Exclui fornecedor |
| GET | `/fornecedores/:id/produtos` | Produtos fornecidos por ele |
| GET | `/produtos` | Lista produtos |
| POST | `/produtos` | Cadastra produto |
| GET | `/produtos/:id` | Busca um produto |
| PUT | `/produtos/:id` | Atualiza produto |
| DELETE | `/produtos/:id` | Exclui produto |
| GET | `/produtos/:id/fornecedores` | Fornecedores do produto |
| POST | `/produtos/:id/fornecedores` | Associa fornecedor (`{ "fornecedorId": 1 }`) |
| DELETE | `/produtos/:id/fornecedores/:fornecedorId` | Desassocia fornecedor |

### Exemplos de corpo (JSON)

**POST /fornecedores**
```json
{
  "nome": "Distribuidora Alfa",
  "cnpj": "11.222.333/0001-81",
  "endereco": "Rua das Flores, 100, Brasília - DF",
  "telefone": "(61) 3333-4444",
  "email": "contato@alfa.com",
  "contato": "Maria Silva"
}
```

**POST /produtos**
```json
{
  "nome": "Teclado Mecânico",
  "codigoBarras": "7891234567895",
  "descricao": "Teclado mecânico ABNT2",
  "quantidade": 10,
  "preco": 199.9,
  "categoria": "Eletrônicos",
  "dataValidade": null
}
```

### Respostas

| Situação | Status | Exemplo de corpo |
|---|---|---|
| Sucesso | 201 | `{ "mensagem": "Fornecedor cadastrado com sucesso!", "fornecedor": { ... } }` |
| Duplicidade (CNPJ / código de barras / associação) | 409 | `{ "erro": "Fornecedor com esse CNPJ já está cadastrado!", "erros": { "cnpj": "..." } }` |
| Dados inválidos ou obrigatórios em branco | 400 | `{ "erro": "Dados inválidos.", "erros": { "nome": "O nome da empresa é obrigatório.", ... } }` |

O objeto `erros` traz uma mensagem por campo; o frontend exibe cada uma ao lado do campo inválido.

## Cenários da Fase 1 e onde estão implementados

| Feature | Cenário | Backend | Teste |
|---|---|---|---|
| Fornecedor | 1º sucesso / 2º CNPJ duplicado / 3º inválido | `fornecedorController.criar` + `validators.js` | `api.test.js` |
| Produto | 1º sucesso / 2º código de barras duplicado / 3º inválido | `produtoController.criar` + `validators.js` | `api.test.js` |
| Associação | 1º associar / 2º já associado / 3º desassociar | `associacaoController` | `api.test.js` |

Decisões de implementação:
- **Código de barras** não é marcado como obrigatório no protótipo, então é opcional; quando informado, deve ser único (8 a 14 dígitos).
- **Preço** aparece na Etapa 2 (descrição do controlador), mas não no protótipo da tela; foi incluído como campo opcional.
- **Quantidade em estoque** é opcional (padrão 0); **data de validade** e **imagem** são opcionais ("se aplicável").
- A **imagem** é enviada em base64 (limite de 2 MB) e guardada no próprio SQLite, por simplicidade.
- Ao excluir um produto ou fornecedor, as associações dele são removidas automaticamente (`ON DELETE CASCADE`).

## Versionamento (Git)

```bash
git init
git add .
git commit -m "Projeto integrador: controle de estoque"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```
