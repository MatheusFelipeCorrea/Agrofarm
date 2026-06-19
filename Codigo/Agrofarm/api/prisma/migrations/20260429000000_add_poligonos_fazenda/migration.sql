-- Habilitar extensão PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Criar tabela de polígonos das fazendas
CREATE TABLE poligonos_fazenda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fazenda_id UUID NOT NULL REFERENCES fazendas(id) ON DELETE CASCADE,
  cultura_id UUID REFERENCES culturas(id) ON DELETE SET NULL,
  nome VARCHAR(100) NOT NULL,
  geometria GEOMETRY(Polygon, 4326) NOT NULL,
  area_hectares DECIMAL(10, 2) NOT NULL,
  data_plantio DATE,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  criado_por UUID REFERENCES usuarios(id) ON DELETE SET NULL,

  CONSTRAINT area_hectares_positiva CHECK (area_hectares > 0),
  CONSTRAINT nome_nao_vazio CHECK (LENGTH(TRIM(nome)) > 0)
);

-- Índices para performance
CREATE INDEX idx_poligonos_fazenda_id ON poligonos_fazenda(fazenda_id);
CREATE INDEX idx_poligonos_cultura_id ON poligonos_fazenda(cultura_id);
CREATE INDEX idx_poligonos_geometria ON poligonos_fazenda USING GIST(geometria);
CREATE INDEX idx_poligonos_criado_em ON poligonos_fazenda(criado_em DESC);

-- Trigger para atualizar atualizado_em automaticamente
CREATE OR REPLACE FUNCTION atualizar_timestamp_poligonos()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_timestamp_poligonos
BEFORE UPDATE ON poligonos_fazenda
FOR EACH ROW
EXECUTE FUNCTION atualizar_timestamp_poligonos();

COMMENT ON TABLE poligonos_fazenda IS 'Armazena polígonos geoespaciais representando áreas de fazendas/talhões';
COMMENT ON COLUMN poligonos_fazenda.geometria IS 'Geometria do polígono em formato PostGIS (SRID 4326 - WGS84)';
COMMENT ON COLUMN poligonos_fazenda.area_hectares IS 'Área calculada do polígono em hectares';
COMMENT ON COLUMN poligonos_fazenda.nome IS 'Nome identificador da área (ex: Talhão A, Área 01)';
COMMENT ON COLUMN poligonos_fazenda.data_plantio IS 'Data de plantio da cultura nesta área (opcional)';
