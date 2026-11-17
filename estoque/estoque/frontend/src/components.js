import React, { useEffect } from 'react';

// Campo de formulário com rótulo e mensagem de erro ao lado (abaixo) do campo.
export function Campo({ label, obrigatorio, erro, children }) {
  return (
    <div className={`campo${erro ? ' campo-erro' : ''}`}>
      <label>
        {label}
        {obrigatorio && <span className="obrigatorio"> *</span>}
      </label>
      {children}
      {erro && <span className="msg-erro">{erro}</span>}
    </div>
  );
}

// Mensagem de sucesso/erro que some sozinha depois de alguns segundos.
export function Aviso({ aviso, onFechar }) {
  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(onFechar, 5000);
    return () => clearTimeout(t);
  }, [aviso, onFechar]);

  if (!aviso) return null;
  return (
    <div className={`aviso aviso-${aviso.tipo}`} role="status">
      <span>{aviso.texto}</span>
      <button type="button" onClick={onFechar} aria-label="Fechar mensagem">
        ×
      </button>
    </div>
  );
}
