CREATE TYPE recorrencia_lembrete AS ENUM ('NENHUMA', 'SEMANAL', 'MENSAL', 'TRIMESTRAL', 'ANUAL', 'OUTROS');

ALTER TABLE lembretes
ADD COLUMN recorrencia recorrencia_lembrete NOT NULL DEFAULT 'NENHUMA',
ADD COLUMN recorrencia_custom VARCHAR(120);

CREATE INDEX idx_lembretes_recorrencia ON lembretes(recorrencia);
