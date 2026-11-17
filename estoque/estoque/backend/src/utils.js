// Utilitários HTTP: erros, leitura do corpo JSON e envio de respostas.

class HttpError extends Error {
  constructor(status, mensagem, erros = {}) {
    super(mensagem);
    this.status = status;
    this.erros = erros; // erros por campo, ex.: { cnpj: 'CNPJ inválido' }
  }
}

const LIMITE_CORPO = 6 * 1024 * 1024; // 6 MB (imagens vão em base64)

function lerJson(req) {
  return new Promise((resolve, reject) => {
    let tamanho = 0;
    const partes = [];
    req.on('data', (chunk) => {
      tamanho += chunk.length;
      if (tamanho > LIMITE_CORPO) {
        reject(new HttpError(413, 'Corpo da requisição muito grande.'));
        req.destroy();
        return;
      }
      partes.push(chunk);
    });
    req.on('end', () => {
      if (partes.length === 0) return resolve({});
      try {
        resolve(JSON.parse(Buffer.concat(partes).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'JSON inválido.'));
      }
    });
    req.on('error', reject);
  });
}

function enviar(res, status, corpo) {
  const json = JSON.stringify(corpo);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(json);
}

function parseId(valor) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, 'Identificador inválido.');
  return n;
}

module.exports = { HttpError, lerJson, enviar, parseId };
