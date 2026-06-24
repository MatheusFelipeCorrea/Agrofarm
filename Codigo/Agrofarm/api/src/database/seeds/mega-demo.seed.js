/**
 * Mega seed: grupo agricola Patrocinio (exportacao + mercado interno).
 * Preserva usuarios. Usa culturas do banco (sem Cafe 3 Coracoes).
 *
 * Uso:
 *   npm run db:reset-demo   (limpar)
 *   npm run db:seed:mega    (popular)
 * Ou: npm run db:seed:mega -- --com-reset
 */
import "dotenv/config";
import { execSync } from "node:child_process";
import prisma from "../client.js";
import {
  addDays,
  between,
  dateOnly,
  pick,
  round2,
  talhaoPolygon,
  insertPoligono,
  insertPoligonoHistorico,
  COMPRADORES_EXPORT,
  COMPRADORES_DOMESTICOS,
  TIPOS_GASTO,
  CATEGORIAS_INSUMO,
  ITENS_INSUMO,
} from "./mega/helpers.js";

const FARMS = [
  {
    key: "bom-jesus",
    nome: "Fazenda Bom Jesus",
    tipo: "PROPRIA",
    localizacao: "Rodovia MG-188, Zona Rural, Patrocinio, MG",
    lat: -18.9284,
    lon: -46.9852,
    ativa: true,
    foco: "exportacao",
  },
  {
    key: "santa-clara",
    nome: "Fazenda Santa Clara",
    tipo: "PROPRIA",
    localizacao: "Fazenda Santa Clara, Patrocinio, MG",
    lat: -18.9451,
    lon: -46.9708,
    ativa: true,
    foco: "misto",
  },
  {
    key: "pirapitinga",
    nome: "Fazenda Pirapitinga",
    tipo: "PROPRIA",
    localizacao: "Patrocinio, MG",
    lat: -18.9556,
    lon: -47.0053,
    ativa: true,
    foco: "graos",
  },
  {
    key: "rio-verde",
    nome: "Fazenda Rio Verde",
    tipo: "ARRENDADA_DE_TERCEIROS",
    localizacao: "Patrocinio, MG",
    lat: -18.9102,
    lon: -46.9514,
    ativa: true,
  },
  {
    key: "horizonte",
    nome: "Fazenda Horizonte",
    tipo: "ARRENDADA_PARA_TERCEIROS",
    localizacao: "Patrocinio, MG",
    lat: -18.9653,
    lon: -46.9387,
    ativa: true,
    arrendamento: { cultura: "Milho", sacas: 1200, periodicidade: "SEMESTRAL", inicio: [2023, 8, 1] },
  },
  {
    key: "vale-graos-cafe",
    nome: "Fazenda Vale do Grao e Cafe",
    tipo: "PROPRIA",
    localizacao: "Estrada Patrocinio-Coromandel, Zona Rural, Patrocinio, MG",
    lat: -18.9321,
    lon: -46.9786,
    ativa: true,
    foco: "diversificado",
    regiao: "cerrado_mg",
  },
  {
    key: "inativa",
    nome: "Fazenda Reserva Leste",
    tipo: "PROPRIA",
    localizacao: "Patrocinio, MG",
    lat: -18.972,
    lon: -46.915,
    ativa: false,
    foco: "inativa",
  },
  // Fazendas regionais para teste de clima (coordenadas reais)
  {
    key: "planalto-mt",
    nome: "Fazenda Planalto Central",
    tipo: "PROPRIA",
    localizacao: "Lucas do Rio Verde, MT",
    lat: -13.0583,
    lon: -55.9198,
    ativa: true,
    foco: "graos",
    regiao: "cerrado_mt",
  },
  {
    key: "pampa-rs",
    nome: "Fazenda Pampa Sul",
    tipo: "PROPRIA",
    localizacao: "Cruz Alta, RS",
    lat: -28.6386,
    lon: -53.6064,
    ativa: true,
    foco: "graos",
    regiao: "pampa_rs",
  },
  {
    key: "oeste-ba",
    nome: "Fazenda Oeste Baiano",
    tipo: "PROPRIA",
    localizacao: "Barreiras, BA",
    lat: -12.1528,
    lon: -45.0028,
    ativa: true,
    foco: "graos",
    regiao: "cerrado_ba",
  },
  {
    key: "vale-es",
    nome: "Fazenda Vale do Rio Doce",
    tipo: "PROPRIA",
    localizacao: "Linhares, ES",
    lat: -19.3911,
    lon: -40.0722,
    ativa: true,
    foco: "cafe",
    regiao: "litoral_es",
  },
  {
    key: "semiarido-pe",
    nome: "Fazenda Sao Francisco",
    tipo: "PROPRIA",
    localizacao: "Petrolina, PE",
    lat: -9.3889,
    lon: -40.5008,
    ativa: true,
    foco: "misto",
    regiao: "semiarido_pe",
  },
  {
    key: "sul-pr",
    nome: "Fazenda Campos Gerais",
    tipo: "PROPRIA",
    localizacao: "Palmeira, PR",
    lat: -25.4297,
    lon: -50.0064,
    ativa: true,
    foco: "graos",
    regiao: "sul_pr",
  },
  {
    key: "amazonia-pa",
    nome: "Fazenda Tapajos",
    tipo: "PROPRIA",
    localizacao: "Santarem, PA",
    lat: -2.4381,
    lon: -54.6996,
    ativa: true,
    foco: "misto",
    regiao: "amazonia_pa",
  },
];

/** Cultivares reais de cafe usadas na Fazenda Vale do Grao e Cafe. */
const CULTIVARES_CAFE = [
  { nome: "Café Arábica", cor: "#6F4E37" },
  { nome: "Café Bourbon", cor: "#5C4033" },
  { nome: "Café Catuaí", cor: "#7B5E3B" },
  { nome: "Café Mundo Novo", cor: "#4A3728" },
  { nome: "Café Acaiá", cor: "#8B6914" },
  { nome: "Café Conilon", cor: "#3D2914" },
];

const GRAOS_REFERENCIA = [
  { nome: "Soja", cor: "#4CAF50" },
  { nome: "Milho", cor: "#FFD700" },
  { nome: "Trigo", cor: "#D4A76A" },
  { nome: "Sorgo", cor: "#C67C3E" },
];

const CULTURA_STATUS = ["PLANTIO", "COLHEITA", "ADUBACAO", "PULVERIZACAO"];
const RECORRENCIAS = ["NENHUMA", "SEMANAL", "MENSAL", "TRIMESTRAL", "ANUAL"];

async function garantirCulturasReferencia() {
  for (const c of [...GRAOS_REFERENCIA, ...CULTIVARES_CAFE]) {
    await prisma.culturas.upsert({
      where: { nome: c.nome },
      create: { nome: c.nome, cor: c.cor },
      update: {},
    });
  }
}

async function carregarCulturas() {
  const todas = await prisma.culturas.findMany({ orderBy: { nome: "asc" } });
  const filtradas = todas.filter((c) => !/3\s*cor/i.test(c.nome));
  const map = Object.fromEntries(filtradas.map((c) => [c.nome, c]));
  return { lista: filtradas, map };
}

function normalizarNome(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function criarFazendas(culturas) {
  const created = {};
  for (const f of FARMS) {
    const arrendamentoCultura =
      f.tipo === "ARRENDADA_PARA_TERCEIROS" && f.arrendamento?.cultura
        ? resolverCultura(culturas, f.arrendamento.cultura)
        : null;

    const row = await prisma.fazendas.create({
      data: {
        nome: f.nome,
        tipo: f.tipo,
        localizacao: f.localizacao,
        latitude: f.lat,
        longitude: f.lon,
        ativa: f.ativa,
        arrendamento_cultura_id: arrendamentoCultura?.id ?? null,
        arrendamento_quantidade_sacas: f.arrendamento?.sacas ?? null,
        arrendamento_periodicidade: f.arrendamento?.periodicidade ?? null,
        arrendamento_data_inicio: f.arrendamento
          ? dateOnly(f.arrendamento.inicio[0], f.arrendamento.inicio[1], f.arrendamento.inicio[2])
          : null,
      },
    });
    created[f.key] = { ...f, id: row.id, arrendamento: f.arrendamento ?? null };
  }
  return created;
}

async function vincularUsuarios(farms, usuarios) {
  const admins = usuarios.filter((u) => u.role === "ADMIN");
  const funcs = usuarios.filter((u) => u.role === "FUNCIONARIO");
  const ativas = [
    "bom-jesus",
    "santa-clara",
    "pirapitinga",
    "rio-verde",
    "horizonte",
    "vale-graos-cafe",
    "planalto-mt",
    "pampa-rs",
    "oeste-ba",
    "vale-es",
    "semiarido-pe",
    "sul-pr",
    "amazonia-pa",
  ];

  for (const key of ativas) {
    for (const u of [...admins, ...funcs]) {
      await prisma.usuarios_fazendas.create({
        data: { usuario_id: u.id, fazenda_id: farms[key].id },
      });
    }
  }
}

function resolverCultura(culturas, preferido) {
  if (culturas.map[preferido]) return culturas.map[preferido];
  const alvo = normalizarNome(preferido.replace(/^cafe\s+/i, ""));
  const porNome = culturas.lista.find((c) => {
    const cn = normalizarNome(c.nome);
    return cn === alvo || cn.includes(alvo) || alvo.includes(cn);
  });
  if (porNome) return porNome;
  if (/cafe/i.test(preferido)) {
    return culturas.lista.find((c) => /^caf[eé]/i.test(c.nome)) ?? null;
  }
  if (/algod/i.test(preferido)) {
    return culturas.lista.find((c) => /algod/i.test(c.nome)) ?? null;
  }
  if (/feij/i.test(preferido)) {
    return culturas.lista.find((c) => /feij/i.test(c.nome)) ?? null;
  }
  if (/cana/i.test(preferido)) {
    return culturas.lista.find((c) => /cana/i.test(c.nome)) ?? null;
  }
  if (/arroz/i.test(preferido)) {
    return culturas.lista.find((c) => /arroz/i.test(c.nome)) ?? null;
  }
  return culturas.lista.find((c) => c.nome.toLowerCase().includes(preferido.toLowerCase())) ?? null;
}

async function criarFazendaCulturas(farms, culturas) {
  const culturasCafeVale = CULTIVARES_CAFE.map((c) => c.nome);
  const graosVale = ["Soja", "Milho", "Trigo", "Sorgo"];

  const culturaPorFazenda = {
    "bom-jesus": ["Soja", "Milho", "Café Arábica", "Café Bourbon", "Trigo"],
    "santa-clara": ["Soja", "Milho", "Trigo", "Sorgo", "Café Catuaí"],
    pirapitinga: ["Soja", "Milho", "Sorgo", "Trigo"],
    "rio-verde": ["Soja", "Milho"],
    horizonte: ["Soja"],
    "vale-graos-cafe": [...graosVale, ...culturasCafeVale],
    inativa: ["Trigo"],
    "planalto-mt": ["Soja", "Milho", "Sorgo"],
    "pampa-rs": ["Trigo", "Soja", "Milho"],
    "oeste-ba": ["Soja", "Milho", "Sorgo"],
    "vale-es": ["Café Arábica", "Café Bourbon", "Café Catuaí", "Café Mundo Novo"],
    "semiarido-pe": ["Soja", "Milho", "Café Conilon"],
    "sul-pr": ["Trigo", "Milho", "Soja"],
    "amazonia-pa": ["Soja", "Milho"],
  };

  const vinculos = [];
  for (const [farmKey, nomes] of Object.entries(culturaPorFazenda)) {
    const farm = farms[farmKey];
    if (!farm) continue;
    let i = 0;
    for (const preferido of nomes) {
      const cultura = resolverCultura(culturas, preferido);
      if (!cultura) continue;
      const status = /^caf[eé]/i.test(cultura.nome) ? "SECAGEM" : CULTURA_STATUS[i % CULTURA_STATUS.length];
      const ha = round2(between(120, 420));
      const v = await prisma.fazenda_culturas.create({
        data: {
          fazenda_id: farm.id,
          cultura_id: cultura.id,
          hectares: ha,
          status,
        },
      });
      vinculos.push({ ...v, farm, cultura, hectares: ha });
      i += 1;
    }
  }
  return vinculos;
}

async function criarTalhoes(farms, culturas, adminId) {
  const poligonos = [];
  const configs = [
    { farm: "bom-jesus", talhoes: ["Soja Norte", "Soja Sul", "Milho Pivot", "Cafe Cerrado", "Algodao Oeste"] },
    { farm: "santa-clara", talhoes: ["Soja A", "Soja B", "Milho 1", "Trigo Irrigado", "Cana Bloco 2"] },
    { farm: "pirapitinga", talhoes: ["Soja Leste", "Milho Centro", "Arroz Baixada", "Feijao Morro"] },
    { farm: "rio-verde", talhoes: ["Soja Arrendada", "Milho Arrendado"] },
    { farm: "horizonte", talhoes: ["Soja Terceiros"] },
    {
      farm: "vale-graos-cafe",
      talhoes: [
        "Soja Vale Norte",
        "Milho Vale Centro",
        "Trigo Vale Oeste",
        "Sorgo Vale Sul",
        "Cafe Arabica Lote 1",
        "Cafe Bourbon Lote 2",
        "Cafe Catuai Lote 3",
        "Cafe Mundo Novo Lote 4",
        "Cafe Acaiá Lote 5",
        "Cafe Conilon Lote 6",
      ],
    },
    { farm: "planalto-mt", talhoes: ["Soja MT Norte", "Milho MT Sul", "Sorgo MT Pivot"] },
    { farm: "pampa-rs", talhoes: ["Trigo RS Oeste", "Soja RS Leste", "Milho RS Centro"] },
    { farm: "oeste-ba", talhoes: ["Soja BA 1", "Milho BA 2", "Sorgo BA 3"] },
    { farm: "vale-es", talhoes: ["Cafe Arabica ES", "Cafe Bourbon ES", "Cafe Catuai ES"] },
    { farm: "semiarido-pe", talhoes: ["Soja PE Irrigado", "Milho PE Pivot", "Cafe Conilon PE"] },
    { farm: "sul-pr", talhoes: ["Trigo PR Alto", "Milho PR Vale", "Soja PR Planalto"] },
    { farm: "amazonia-pa", talhoes: ["Soja PA Tapajos", "Milho PA Beira"] },
  ];

  const talhaoCultura = {
    Soja: "Soja",
    Milho: "Milho",
    Cafe: "Café Arábica",
    Trigo: "Trigo",
    Sorgo: "Sorgo",
    Arroz: "Arroz",
    Feijao: "Feijão",
    Cana: "Cana-de-açúcar",
    Algodao: "Algodão",
  };

  function culturaPorNomeTalhao(nomeTalhao) {
    const n = nomeTalhao.toLowerCase();
    if (n.includes("arabica")) return "Café Arábica";
    if (n.includes("bourbon")) return "Café Bourbon";
    if (n.includes("catuai") || n.includes("catuaí")) return "Café Catuaí";
    if (n.includes("mundo novo")) return "Café Mundo Novo";
    if (n.includes("acaiá") || n.includes("acaia")) return "Café Acaiá";
    if (n.includes("conilon") || n.includes("robusta")) return "Café Conilon";
    const prefixo = nomeTalhao.split(" ")[0];
    return talhaoCultura[prefixo] ?? prefixo;
  }

  let slot = 0;
  for (const cfg of configs) {
    const farm = farms[cfg.farm];
    for (const nomeTalhao of cfg.talhoes) {
      const culturaNome = culturaPorNomeTalhao(nomeTalhao);
      const cultura =
        resolverCultura(culturas, culturaNome) ||
        culturas.map.Soja ||
        culturas.lista[slot % culturas.lista.length];
      const offset = (slot % 5) * 0.014;
      const id = await insertPoligono({
        fazendaId: farm.id,
        culturaId: cultura.id,
        nome: nomeTalhao,
        geojson: talhaoPolygon(farm.lon, farm.lat, offset * 0.7, offset * 0.5, 0.011),
        areaHectares: round2(between(85, 220)),
        dataPlantio: dateOnly(2025, 3 + (slot % 4), 10 + (slot % 18)),
        criadoPor: adminId,
      });
      poligonos.push({ id, farm, cultura, nome: nomeTalhao });
      slot += 1;
    }
  }
  return poligonos;
}

async function criarColheitas(vinculos) {
  const colheitas = [];
  const anos = [2023, 2024, 2025, 2026];
  const ativos = vinculos.filter((v) => v.farm.ativa && v.farm.key !== "inativa");

  for (const v of ativos) {
    for (const ano of anos) {
      if (/^caf[eé]/i.test(v.cultura.nome) && ano < 2024) continue;
      const sacas = round2(between(800, 4200));
      const area = round2(Number(v.hectares) * between(0.85, 1.05));
      const c = await prisma.colheitas.create({
        data: {
          fazenda_id: v.farm.id,
          cultura_id: v.cultura.id,
          area,
          sacas_produzidas: sacas,
          ano,
          data_colheita: dateOnly(ano, 4 + (ano % 3), 15),
        },
      });
      colheitas.push({ ...c, farm: v.farm, cultura: v.cultura });
    }
  }
  return colheitas;
}

async function criarGastos(colheitas) {
  let count = 0;
  for (const col of colheitas) {
    // 3-4 gastos por colheita — volume moderado para saldo demo equilibrado no dashboard
    const n = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < n; i += 1) {
      const tipo = pick(TIPOS_GASTO);
      const diasAtras = i === 0 ? between(5, 35) : between(-30, 60);
      const dataBase = col.data_colheita;
      const venc = addDays(dataBase, -diasAtras);
      const pago = diasAtras < 0 && Math.random() > 0.35;
      await prisma.gastos.create({
        data: {
          colheita_id: col.id,
          tipo,
          valor: round2(between(28000, 72000)),
          data: dateOnly(venc.getUTCFullYear(), venc.getUTCMonth() + 1, venc.getUTCDate()),
          data_vencimento: dateOnly(venc.getUTCFullYear(), venc.getUTCMonth() + 1, venc.getUTCDate()),
          status: pago ? "PAGO" : "PENDENTE",
          descricao: `${tipo} - ${col.cultura.nome} ${col.farm.nome}`,
        },
      });
      count += 1;
    }
  }
  return count;
}

async function criarLucros(colheitas, farms) {
  let count = 0;
  for (const col of colheitas) {
    const exportacao = col.farm.foco === "exportacao" || Math.random() > 0.55;
    const sacasVendidas = round2(Number(col.sacas_produzidas) * between(0.5, 0.92));
    const precoSaca = exportacao ? round2(between(125, 148)) : round2(between(108, 132));
    await prisma.lucros.create({
      data: {
        colheita_id: col.id,
        origem: "VENDA_COLHEITA",
        quantidade_sacas: sacasVendidas,
        valor_unitario: precoSaca,
        comprador: exportacao ? pick(COMPRADORES_EXPORT) : pick(COMPRADORES_DOMESTICOS),
        data: addDays(col.data_colheita, between(5, 45)),
      },
    });
    count += 1;
    if (Math.random() > 0.6) {
      await prisma.lucros.create({
        data: {
          colheita_id: col.id,
          origem: "VENDA_COLHEITA",
          quantidade_sacas: round2(sacasVendidas * between(0.1, 0.35)),
          valor_unitario: round2(precoSaca * between(1.02, 1.12)),
          comprador: pick(COMPRADORES_DOMESTICOS),
          data: addDays(col.data_colheita, between(50, 90)),
        },
      });
      count += 1;
    }
  }

  if (farms.horizonte?.id) {
    const { sincronizarEntregasArrendamento } = await import(
      "../../shared/fazenda/arrendamentoEntrega.js"
    );
    await sincronizarEntregasArrendamento(farms.horizonte.id);
  }

  return count;
}

async function criarInsumos(farms, usuarios) {
  const func = usuarios.find((u) => u.role === "FUNCIONARIO") ?? usuarios[0];
  const farmKeys = [
    "bom-jesus",
    "santa-clara",
    "pirapitinga",
    "rio-verde",
    "vale-graos-cafe",
    "planalto-mt",
    "pampa-rs",
    "oeste-ba",
    "vale-es",
    "semiarido-pe",
    "sul-pr",
    "amazonia-pa",
  ];
  let count = 0;
  for (let i = 0; i < 55; i += 1) {
    const farm = farms[pick(farmKeys)];
    const cat = pick(CATEGORIAS_INSUMO);
    const item = pick(ITENS_INSUMO[cat]);
    const d = addDays(new Date(), -between(1, 200));
    await prisma.insumos_atividades.create({
      data: {
        funcionario_id: func.id,
        fazenda_id: farm.id,
        item,
        categoria: cat,
        quantidade: round2(between(10, 800)),
        unidade: cat === "SEMENTE" ? "sc" : "kg",
        valor_unitario: round2(between(2.5, 120)),
        fornecedor: pick(["AgroPatrocinio", "Coop MG", "Yara Brasil", "Bayer Crop"]),
        observacoes: `Entrada ${item} - lote ${1000 + i}`,
        data: dateOnly(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()),
      },
    });
    count += 1;
  }
  return count;
}

async function criarLembretes(farms, usuarios, poligonos, colheitas) {
  const admin = usuarios.find((u) => u.role === "ADMIN") ?? usuarios[0];
  const titulos = [
    "Pulverizacao herbicida",
    "Revisao pivots irrigacao",
    "Vistoria silo armazem",
    "Reuniao exportacao safra",
    "Pagamento energia rural",
    "Manutencao colheitadeira",
    "Analise solo laboratorio",
    "Entrega sementes talhao norte",
    "Conferencia contrato arrendamento",
    "Envio documentacao exportacao",
  ];
  let count = 0;
  const farmList = Object.values(farms).filter((f) => f.ativa);

  for (let i = 0; i < 45; i += 1) {
    const farm = pick(farmList);
    const futuro = addDays(new Date(), between(-15, 90));
    const status = futuro < new Date() ? (Math.random() > 0.3 ? "ENVIADO" : "PENDENTE") : "PENDENTE";
    const col = Math.random() > 0.5 ? pick(colheitas.filter((c) => c.fazenda_id === farm.id)) : null;
    const pol = Math.random() > 0.6 ? pick(poligonos.filter((p) => p.farm.id === farm.id)) : null;
    await prisma.lembretes.create({
      data: {
        usuario_id: admin.id,
        fazenda_id: farm.id,
        colheita_id: col?.id ?? null,
        poligono_id: pol?.id ?? null,
        titulo: pick(titulos),
        descricao: `Lembrete operacional ${farm.nome} - safra ${2025 + (i % 2)}`,
        data_lembrete: futuro,
        status,
        recorrencia: pick(RECORRENCIAS),
        recorrencia_custom: i % 7 === 0 ? "A cada 15 dias" : null,
        telefone_whatsapp: i % 3 === 0 ? "+5534999001122" : null,
        enviado_em: status === "ENVIADO" ? addDays(futuro, -1) : null,
      },
    });
    count += 1;
  }
  return count;
}

async function criarHistoricoMapa(farms, culturas, colheitas, _adminId) {
  const farm = farms["santa-clara"];
  const cultura = culturas.map.Milho ?? culturas.lista[0];
  const col = colheitas.find((c) => c.farm_id === farm.id && c.cultura_id === cultura.id);
  const geo = talhaoPolygon(farm.lon, farm.lat, 0.08, 0.06, 0.009);
  await insertPoligonoHistorico({
    fazendaId: farm.id,
    culturaId: cultura.id,
    colheitaId: col?.id ?? null,
    nome: "Milho Area Antiga",
    geojson: geo,
    areaHectares: 156.4,
    status: "COLHIDA",
    dataPlantio: dateOnly(2024, 10, 5),
    dataColheita: dateOnly(2025, 3, 20),
  });
  await insertPoligonoHistorico({
    fazendaId: farms["pirapitinga"].id,
    culturaId: culturas.map.Soja?.id,
    nome: "Soja Encerrada Sem Colheita",
    geojson: talhaoPolygon(farms["pirapitinga"].lon, farms["pirapitinga"].lat, 0.05, 0.04, 0.01),
    areaHectares: 98.2,
    status: "ENCERRADA",
    dataPlantio: dateOnly(2024, 11, 1),
    dataColheita: null,
  });
}

async function criarSimulacoes(farms, culturas, usuarios) {
  const admin = usuarios.find((u) => u.role === "ADMIN") ?? usuarios[0];
  const soja = culturas.map.Soja;
  const milho = culturas.map.Milho;
  const cafe = resolverCultura(culturas, "Café Arábica");
  const configs = [
    { farm: "bom-jesus", cultura: soja, sacas: 12000, valor: 128, moeda: "USD", taxa: 5.42 },
    { farm: "bom-jesus", cultura: milho, sacas: 8500, valor: 118, moeda: "USD", taxa: 5.38 },
    { farm: "santa-clara", cultura: soja, sacas: 6000, valor: 132, moeda: "BRL", taxa: null },
    { farm: "pirapitinga", cultura: milho, sacas: 4200, valor: 108, moeda: "BRL", taxa: null },
    { farm: "vale-graos-cafe", cultura: soja, sacas: 9500, valor: 130, moeda: "USD", taxa: 5.4 },
    { farm: "vale-graos-cafe", cultura: cafe, sacas: 3200, valor: 248, moeda: "USD", taxa: 5.4 },
    { farm: "planalto-mt", cultura: soja, sacas: 15000, valor: 125, moeda: "BRL", taxa: null },
    { farm: "pampa-rs", cultura: culturas.map.Trigo ?? soja, sacas: 5500, valor: 98, moeda: "BRL", taxa: null },
  ];
  for (const cfg of configs) {
    if (!cfg.cultura) continue;
    const bruto = cfg.sacas * cfg.valor * (cfg.moeda === "USD" ? cfg.taxa : 1);
    const taxas = { comissao: 0.02, frete: 0.04, armazenagem: 0.01 };
    const liquido = bruto * (1 - taxas.comissao - taxas.frete - taxas.armazenagem);
    await prisma.simulacoes.create({
      data: {
        usuario_id: admin.id,
        fazenda_id: farms[cfg.farm].id,
        cultura_id: cfg.cultura.id,
        quantidade_sacas: cfg.sacas,
        valor_saca: cfg.valor,
        moeda: cfg.moeda,
        taxa_cambio_manual: cfg.taxa,
        valor_bruto: round2(bruto),
        valor_liquido: round2(liquido),
        composicao_taxas: taxas,
        abatimento_divida: round2(liquido * 0.15),
        novo_saldo_divida: round2(liquido * 0.85),
      },
    });
  }
}

async function criarCotacoes() {
  const itens = [
    { fonte: "soja", valor: 128.4 },
    { fonte: "milho", valor: 112.8 },
    { fonte: "cafe", valor: 245.5 },
    { fonte: "dolar", valor: 5.42 },
    { fonte: "trigo", valor: 98.2 },
  ];
  for (const c of itens) {
    await prisma.cotacoes.create({ data: c });
  }
}

async function criarChatInsight(usuarios, farms) {
  const admin = usuarios.find((u) => u.role === "ADMIN") ?? usuarios[0];
  const sessao = await prisma.chat_sessoes.create({
    data: {
      usuario_id: admin.id,
      titulo: "Exportacao safra Soja 2026",
    },
  });
  const msgs = [
    { papel: "user", conteudo: "Qual a margem estimada da exportacao da Fazenda Bom Jesus?" },
    {
      papel: "assistant",
      conteudo:
        "Com base nas colheitas e lucros registrados, a margem operacional estimada fica entre 22% e 28% na safra 2025/2026, considerando custos de fertilizantes e frete.",
    },
    { papel: "user", conteudo: "Quais talhoes de Soja tem maior produtividade em Patrocinio?" },
  ];
  for (const m of msgs) {
    await prisma.chat_mensagens.create({
      data: { sessao_id: sessao.id, papel: m.papel, conteudo: m.conteudo },
    });
  }
  await prisma.insight_snapshots.create({
    data: {
      tipo: "recomendacao_fazenda",
      fazenda_id: farms["bom-jesus"].id,
      escopo: "FAZENDA",
      conteudo: {
        texto: "Priorizar comercializacao de Soja Norte com comprador internacional; revisar gastos de energia pendentes.",
        prioridade: "alta",
      },
      gerado_por: admin.id,
    },
  });
}

async function main() {
  const comReset = process.argv.includes("--com-reset");
  if (comReset) {
    console.log("[mega] Executando reset antes do seed...");
    execSync("node src/database/seeds/demo-reset.seed.js", { stdio: "inherit" });
  }

  console.log("[mega] Iniciando mega seed AgroFarm Patrocinio + regioes BR...");
  const usuarios = await prisma.usuarios.findMany();
  if (!usuarios.length) {
    throw new Error("Nenhum usuario encontrado. Rode npm run db:seed (admin) antes.");
  }
  const admin = usuarios.find((u) => u.role === "ADMIN") ?? usuarios[0];
  await garantirCulturasReferencia();
  const culturas = await carregarCulturas();
  console.log(`[mega] Culturas disponiveis: ${culturas.lista.map((c) => c.nome).join(", ")}`);

  const farms = await criarFazendas(culturas);
  await vincularUsuarios(farms, usuarios);
  const vinculos = await criarFazendaCulturas(farms, culturas);
  const poligonos = await criarTalhoes(farms, culturas, admin.id);
  const colheitas = await criarColheitas(vinculos);
  const nGastos = await criarGastos(colheitas);
  const nLucros = await criarLucros(colheitas, farms);
  const nInsumos = await criarInsumos(farms, usuarios);
  const nLembretes = await criarLembretes(farms, usuarios, poligonos, colheitas);
  await criarHistoricoMapa(farms, culturas, colheitas, admin.id);
  await criarSimulacoes(farms, culturas, usuarios);
  await criarCotacoes();
  await criarChatInsight(usuarios, farms);

  console.log("[mega] Resumo:");
  console.log(`  Fazendas: ${Object.keys(farms).length}`);
  console.log(`  Talhoes (poligonos): ${poligonos.length}`);
  console.log(`  Vinculos cultura: ${vinculos.length}`);
  console.log(`  Colheitas: ${colheitas.length}`);
  console.log(`  Gastos: ${nGastos}`);
  console.log(`  Lucros: ${nLucros}`);
  console.log(`  Insumos: ${nInsumos}`);
  console.log(`  Lembretes: ${nLembretes}`);
  console.log("[mega] Concluido. Notificacoes serao geradas ao abrir o painel (sync automatica).");
}

main()
  .catch((err) => {
    console.error("[mega] Erro:", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
