CREATE TYPE tipo_notificacao AS ENUM ('LEMBRETE', 'INSUMO_NOVO');

CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo tipo_notificacao NOT NULL,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT,
  rota VARCHAR(255),
  referencia_id UUID,
  lida_em TIMESTAMP(6),
  criado_em TIMESTAMP(6) NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP(6) NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX notificacoes_usuario_tipo_referencia_unique
ON notificacoes(usuario_id, tipo, referencia_id);

CREATE INDEX idx_notificacoes_usuario_id ON notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_usuario_criado_em ON notificacoes(usuario_id, criado_em DESC);
CREATE INDEX idx_notificacoes_lida_em ON notificacoes(lida_em);
