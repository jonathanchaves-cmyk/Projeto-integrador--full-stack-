// Servidor HTTP do sistema de controle de estoque.
const http = require('http');
const { encontrar } = require('./src/router');
const { HttpError, lerJson, enviar } = require('./src/utils');

const PORT = process.env.PORT || 3001; // 3000 fica livre para o React

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') return enviar(res, 204, {}); // pré-voo do CORS

    const url = new URL(req.url, `http://${req.headers.host}`);
    const alvo = encontrar(req.method, url.pathname);

    if (alvo.naoPermitido) throw new HttpError(405, 'Método não permitido.');
    if (!alvo.handler) throw new HttpError(404, 'Rota não encontrada.');

    const body = ['POST', 'PUT', 'PATCH'].includes(req.method) ? await lerJson(req) : {};
    const resultado = await alvo.handler({ params: alvo.params, body, query: url.searchParams });
    enviar(res, resultado.status, resultado.body);
  } catch (err) {
    if (err instanceof HttpError) return enviar(res, err.status, { erro: err.message, erros: err.erros });
    console.error(err);
    enviar(res, 500, { erro: 'Erro interno do servidor.' });
  }
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}/`);
  });
}

module.exports = server;
