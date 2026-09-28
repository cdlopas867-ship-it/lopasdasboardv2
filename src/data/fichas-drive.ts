import imgCadeiraApogeu from "@/assets/produtos/cadeira-apogeu.jpg";
import imgCadeiraRayla from "@/assets/produtos/cadeira-rayla.jpg";
import imgGrEasySlim from "@/assets/produtos/gr-easy-slim.jpg";
import imgSapateiraEsthela from "@/assets/produtos/sapateira-esthela.jpg";
import imgComodaLoop from "@/assets/produtos/comoda-loop.jpg";
import imgGrSerenata from "@/assets/produtos/gr-serenata.jpg";
import imgGrAlonzo from "@/assets/produtos/gr-alonzo.jpg";
import imgGrNice from "@/assets/produtos/gr-nice.jpg";
import imgGrZeusPlus from "@/assets/produtos/gr-zeus-plus.jpg";
import imgMesasApogeu from "@/assets/produtos/mesas-apogeu.jpg";
import imgMesasAthenas from "@/assets/produtos/mesas-athenas.jpg";
import imgComodaDavinci from "@/assets/produtos/comoda-davinci.jpg";
import catGuardaRoupas from "@/assets/cat-guarda-roupas.jpg";
import catSalas from "@/assets/cat-salas.jpg";
import catComplementos from "@/assets/cat-complementos.jpg";
import imgImperatore from "@/assets/produtos/imperatore.jpg";
import imgCalitan from "@/assets/produtos/calitan.jpg";
import imgMaggiore from "@/assets/produtos/maggiore.jpg";
import imgVedra from "@/assets/produtos/vedra.jpg";
import imgBaiao from "@/assets/produtos/baiao.jpg";
import imgUrban from "@/assets/produtos/urban.jpg";
import imgErgon from "@/assets/produtos/ergon.jpg";
import imgStyle from "@/assets/produtos/style.jpg";
import imgToronto from "@/assets/produtos/toronto.jpg";
import imgGrToronto from "@/assets/produtos/gr-toronto.jpg";
import imgReali from "@/assets/produtos/reali.jpg";
import imgCamaAthenasCasal from "@/assets/produtos/cama-athenas-casal.jpg";
import imgCamaAthenasSolteiro from "@/assets/produtos/cama-athenas-solteiro.webp";
import imgBelicheOlga from "@/assets/produtos/beliche-olga.jpg";
import imgQuadrix from "@/assets/produtos/quadrix.jpg";
import imgZeine from "@/assets/produtos/zeine.jpg";
import imgBertha from "@/assets/produtos/bertha.jpg";
import imgAries from "@/assets/produtos/aries.jpg";
import imgSuavita from "@/assets/produtos/suavita.jpg";
import imgGrLoop from "@/assets/produtos/gr-loop.jpg";
import imgTessera from "@/assets/produtos/tessera.jpg";
import imgLuar from "@/assets/produtos/luar.jpg";
import imgExclusive from "@/assets/produtos/exclusive.jpg";
import imgEasyLike from "@/assets/produtos/easy-like.jpg";
/* Fotos reais por cor (Meu Móvel Online / cdn.awsli, set/2026) */
import imgAthenasCasalAmendoa from "@/assets/produtos/athenas-casal-amendoa.jpg";
import imgAthenasCasalBranco from "@/assets/produtos/athenas-casal-branco.jpg";
import imgAthenasCasalFrassino from "@/assets/produtos/athenas-casal-frassino.jpg";
import imgAthenasSoltAmendoa from "@/assets/produtos/athenas-solt-amendoa.jpg";
import imgAthenasSoltBranco from "@/assets/produtos/athenas-solt-branco.jpg";
import imgAthenasSoltFrassino from "@/assets/produtos/athenas-solt-frassino.jpg";
import imgRealiAmendoa from "@/assets/produtos/reali-amendoa.jpg";
import imgRealiFrassino from "@/assets/produtos/reali-frassino.jpg";
import imgBerthaAmendoa from "@/assets/produtos/bertha-amendoa.jpg";
import imgBerthaFrassino from "@/assets/produtos/bertha-frassino.jpg";
import imgNiceAmendoa from "@/assets/produtos/nice-amendoa.jpg";
import imgBaiaoAmendoa from "@/assets/produtos/baiao-amendoa.jpg";
import imgBaiaoBranco from "@/assets/produtos/baiao-branco.jpg";
import imgTorontoAmendoa from "@/assets/produtos/toronto-amendoa.jpg";
import imgTorontoBranco from "@/assets/produtos/toronto-branco.jpg";
import imgTorontoFrassino from "@/assets/produtos/toronto-frassino.jpg";
import imgVedraAmendoa from "@/assets/produtos/vedra-amendoa.jpg";
import { chaveCor } from "@/data/mascaras";

/* Fichas técnicas oficiais 2026 (PDFs no Drive da Lopas) + foto real do volume,
   ligados a cada item do estoque pela descrição do produto. As fotos vêm do
   catálogo oficial/varejo da Lopas — uma por linha de produto. */

export type FichaOficial = {
  titulo: string;
  driveId: string | null; // ID do PDF no Google Drive (null = sem ficha publicada)
  foto: string; // imagem real do produto/volume
  fotosCor?: Record<string, string>; // foto real por cor principal (amêndoa, branco, frassino...)
  fotoRealDaCor?: boolean; // true quando a foto já é da cor do item (não precisa tingir)
};

const REGRAS: { chaves: string[]; ficha: FichaOficial }[] = [
  /* Linhas com foto real — mais específicas primeiro, estruturais no final */
  { chaves: ["IMPERATORE"], ficha: { titulo: "GR 6 Portas Imperatore 2023", driveId: null, foto: imgImperatore } },
  { chaves: ["CALITAN"], ficha: { titulo: "Cabeceira Calitan 1,60 2023", driveId: null, foto: imgCalitan } },
  { chaves: ["MAGGIORE"], ficha: { titulo: "Cômoda Maggiore New", driveId: null, foto: imgMaggiore } },
  { chaves: ["VEDRA"], ficha: { titulo: "Cômoda Vedra 2 Portas 7 Gav.", driveId: null, foto: imgVedra, fotosCor: { AMENDOA: imgVedraAmendoa } } },
  { chaves: ["BAIAO", "BAIÃO"], ficha: { titulo: "Cômoda Baião 4 Gav. 2021", driveId: null, foto: imgBaiao, fotosCor: { AMENDOA: imgBaiaoAmendoa, BRANCO: imgBaiaoBranco } } },
  { chaves: ["URBAN"], ficha: { titulo: "Cômoda Urban 8 Gav.", driveId: null, foto: imgUrban } },
  { chaves: ["ERGON"], ficha: { titulo: "GR Ergon 8 Portas c/ Espelho", driveId: null, foto: imgErgon } },
  { chaves: ["STYLE"], ficha: { titulo: "GR Style 6 Portas c/ Espelho", driveId: null, foto: imgStyle } },
  { chaves: ["REALI"], ficha: { titulo: "Cama Reali Plus", driveId: null, foto: imgReali, fotosCor: { AMENDOA: imgRealiAmendoa, FRASSINO: imgRealiFrassino } } },
  { chaves: ["LUAR"], ficha: { titulo: "Cadeira Luar", driveId: null, foto: imgLuar } },
  { chaves: ["EXCLUSIVE"], ficha: { titulo: "Cadeira Exclusive", driveId: null, foto: imgExclusive } },
  { chaves: ["ATHENAS CASAL"], ficha: { titulo: "Cama Casal 1,40 Athenas 2022", driveId: "1L4r7H3giYFUlP-ckVhUTA_Yy7qdW65cQ", foto: imgCamaAthenasCasal, fotosCor: { AMENDOA: imgAthenasCasalAmendoa, BRANCO: imgAthenasCasalBranco, FRASSINO: imgAthenasCasalFrassino } } },
  { chaves: ["ATHENAS SOLT"], ficha: { titulo: "Cama Solteiro 0,90 Athenas 2022", driveId: "19nr0yzsemPIRd09M-6wYk_y6IJ3aIMxH", foto: imgCamaAthenasSolteiro, fotosCor: { AMENDOA: imgAthenasSoltAmendoa, BRANCO: imgAthenasSoltBranco, FRASSINO: imgAthenasSoltFrassino } } },
  /* Volumes de cama genéricos (barras, painéis, pés, camas auxiliares) — foto real de cama */
  { chaves: ["CAMA"], ficha: { titulo: "Volumes de Cama", driveId: null, foto: imgReali, fotosCor: { AMENDOA: imgRealiAmendoa, FRASSINO: imgRealiFrassino } } },
  { chaves: ["EASY SLIM", "ANDARA"], ficha: { titulo: "GR 8 Portas Easy Slim/Andara Soft 2024", driveId: "1uZulRy40h_xZIOyWot6nzctpwhc6F7ht", foto: imgGrEasySlim } },
  { chaves: ["ALONZO"], ficha: { titulo: "GR 6 Portas Alonzo 2021", driveId: "1od6T3jPnXQpLXdgkDnxSOHeYA7hCvO2s", foto: imgGrAlonzo } },
  { chaves: ["LIKE"], ficha: { titulo: "Cômoda Easy Like", driveId: null, foto: imgEasyLike } },
  { chaves: ["ZEUS"], ficha: { titulo: "GR 6 Portas Zeus 2021", driveId: "1aQWGN294w3yWOtwGIC_D4paJGJWAvrsA", foto: imgGrZeusPlus } },
  { chaves: ["SERENATA"], ficha: { titulo: "GR 8 Portas Serenata", driveId: "1RLC5ek3px2UV6cEJGgpwAIu1eQ2Mn1gb", foto: imgGrSerenata } },
  { chaves: ["NICE"], ficha: { titulo: "GR 3 Portas Nice", driveId: "16nu6vtypxWzwdgpnRGbQGcBODjWZclck", foto: imgGrNice, fotosCor: { AMENDOA: imgNiceAmendoa } } },
  { chaves: ["QUADRIX"], ficha: { titulo: "GR 3 Portas Quadrix", driveId: "1snKgquav34L5AGdHM7ll67N502820VKj", foto: imgQuadrix } },
  { chaves: ["ZEINE"], ficha: { titulo: "GR 2 Portas Zeine 2024", driveId: "1r2pRQjR_Mj4laE5koGTM4yuGCsUMOJQn", foto: imgZeine } },
  { chaves: ["BERTHA"], ficha: { titulo: "GR 6 Portas Bertha", driveId: "1f9nJANFfTUvdVXQ5ypOdzzBhJDEPaCCE", foto: imgBertha, fotosCor: { AMENDOA: imgBerthaAmendoa, FRASSINO: imgBerthaFrassino } } },
  { chaves: ["ARIES", "ÁRIES"], ficha: { titulo: "GR 6 Portas Aries 2021", driveId: "15mvJIoK3YLyFwTf2d_O1XIAlgJQroKOs", foto: imgAries } },
  { chaves: ["SUAVITA", "SUAVITÁ"], ficha: { titulo: "GR 6 Portas Suavita", driveId: "1gU8BbLVIZJkEsBWBUFInqGtY2D6EMwQC", foto: imgSuavita } },
  { chaves: ["OLLIE"], ficha: { titulo: "GR 3 Portas Ollie II 2025", driveId: "1w9NYjXUaacfm3vikPtN6d-hZmMKKrbpz", foto: catGuardaRoupas } },
  { chaves: ["SPAZIO"], ficha: { titulo: "GR 3 Portas Spazio 2,70", driveId: null, foto: catGuardaRoupas } },
  { chaves: ["PTS LOOP", "GR LOOP"], ficha: { titulo: "GR Loop 4–6 Portas", driveId: null, foto: imgGrLoop } },
  { chaves: ["LOOP"], ficha: { titulo: "Cômoda Loop II 2024", driveId: "1np_R4JlBH47xEOgpsa1sN0NV6CcaEZ-8", foto: imgComodaLoop } },
  { chaves: ["ESTHELA"], ficha: { titulo: "Sapateira Esthela 2024", driveId: "1azaRgL4fySl2jUCRA6hVu1x2poyyIkAI", foto: imgSapateiraEsthela } },
  { chaves: ["TORONTO PLUS", "GR 2 PTS TORONTO"], ficha: { titulo: "GR 2 Portas de Correr Toronto Plus", driveId: null, foto: imgGrToronto } },
  { chaves: ["TORONTO"], ficha: { titulo: "Cômoda Toronto 8 Gav. 2 PTS 2021", driveId: "10AdCCOlcoV40erOBj-yyaBmMSJjfjtOY", foto: imgToronto, fotosCor: { AMENDOA: imgTorontoAmendoa, BRANCO: imgTorontoBranco, FRASSINO: imgTorontoFrassino } } },
  { chaves: ["DA VINCI", "DAVINCI"], ficha: { titulo: "Cômoda Da Vinci 6 Gav. 2021", driveId: "1pBofyfUQ-8FBPRE3_KxzzUlziFNvTxUA", foto: imgComodaDavinci } },
  { chaves: ["LIVIA"], ficha: { titulo: "Penteadeira Lívia c/ LED", driveId: null, foto: imgComodaDavinci } },
  { chaves: ["BELICHE", "OLGA"], ficha: { titulo: "Beliche 0,90 Olga", driveId: "1vICeYFQS1AtHaa68rkAjH8_0VLBQjfGk", foto: imgBelicheOlga } },
  { chaves: ["TESSERA", "BONNA"], ficha: { titulo: "Cadeira Tessera C/4", driveId: "1ek4EXUUFZ0CrxLxDftFP_fz6X5R1He4n", foto: imgTessera } },
  { chaves: ["ATHENAS"], ficha: { titulo: "Cadeira Athenas 2025 C/4", driveId: "1vMOfjaMwEElyqQb2boLIBgtENSWXT0FR", foto: imgMesasAthenas } },
  { chaves: ["MESA DE CABECEIRA"], ficha: { titulo: "Mesa de Cabeceira Loop 2024", driveId: "1hlEwt_7RwHMd2eDPU838HjhV83E4Pm_o", foto: imgComodaLoop } },
  { chaves: ["MESA"], ficha: { titulo: "Mesa 1,70 Apogeu 2023", driveId: "1op2kzdoHvzLKgDgJeo8wXzMW6p5Litde", foto: imgMesasApogeu } },
  { chaves: ["APEGEU", "APOGEU"], ficha: { titulo: "Cadeira Apogeu 2025 C/4", driveId: "1oYjpLYdtj63yk-N3nRB7wtWwzPYvi0O4", foto: imgCadeiraApogeu } },
  { chaves: ["RAYLA"], ficha: { titulo: "Cadeira Rayla 2025 C/4", driveId: "1VnDBCeQSqEQx2QMiU-g7JsgBuGytsD0e", foto: imgCadeiraRayla } },
];

const FOTO_UNIDADE: Record<string, string> = {
  "UNIDADE GUARDA ROUPAS": catGuardaRoupas,
  "UNIDADE DE SALAS": catSalas,
  "UNIDADE DE COMPLEMENTOS": catComplementos,
};

/* Fallback por unidade tolera variações de texto da planilha
   (ex.: "UNIDADE DE COMPLEMENTO", "SALAS") para não cair na foto errada. */
function fotoDaUnidade(unidade: string): string {
  const u = unidade.toUpperCase();
  if (u.includes("COMPLEMENTO")) return catComplementos;
  if (u.includes("SALA")) return catSalas;
  if (u.includes("GUARDA")) return catGuardaRoupas;
  return FOTO_UNIDADE[u] ?? catGuardaRoupas;
}

/* A descrição vinda da planilha pode trazer entidades HTML (&#160;, &nbsp;) no
   lugar dos espaços — decodifica e normaliza para o casamento das chaves
   funcionar (ex.: "ATHENAS&#160;&#160;SOLT" precisa casar com "ATHENAS SOLT"). */
export function limparDesc(desc: string): string {
  return desc.replace(/&#160;|&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

/* Passa a máscara do item para escolher a foto real da cor quando existe
   (senão devolve a foto da linha, que o card tinge na cor do item). */
export function resolverFicha(desc: string, unidade: string, mascara?: string): FichaOficial {
  const alvo = limparDesc(desc).toUpperCase();
  for (const r of REGRAS) {
    if (!r.chaves.some((c) => alvo.includes(c))) continue;
    const chave = mascara ? chaveCor(mascara) : null;
    const foto = chave ? r.ficha.fotosCor?.[chave] : undefined;
    return foto ? { ...r.ficha, foto, fotoRealDaCor: true } : r.ficha;
  }
  return { titulo: "", driveId: null, foto: fotoDaUnidade(unidade) };
}
