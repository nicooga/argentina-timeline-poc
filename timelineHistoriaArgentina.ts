import type { Timeline, TimelineEvent } from "./types";

/** Fecha civil gregoriana en UTC (mediodía), sin corrimiento por zona del navegador. */
function utcDate(year: number, month: number, day: number): Date {
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

type SeedTimelineEvent = Omit<TimelineEvent, "id" | "causes" | "consequences"> & {
    causes?: string[];
    consequences?: string[];
};

function eventIdFromTitle(title: string): string {
    return title
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function withEventIds(events: SeedTimelineEvent[]): TimelineEvent[] {
    const titleToId = new Map(events.map((e) => [e.title, eventIdFromTitle(e.title)]));
    return events.map((e) => ({
        ...e,
        id: titleToId.get(e.title)!,
        causes: e.causes?.map((title) => titleToId.get(title) ?? title),
        consequences: e.consequences?.map((title) => titleToId.get(title) ?? title),
    }));
}

export const timelineHistoriaArgentina: Timeline = {
    periods: [
        {
            title: "Revolución y crisis del orden colonial",
            start: utcDate(1810, 5, 25),
            end: utcDate(1820, 2, 1),
            color: "#6d7470", // gris salvia (ruptura / transición)
            items: [
                "Ruptura del orden colonial con la Revolución de Mayo.",
                "Intentos fallidos de centralización (Directorio).",
                "Independencia sin construcción de un Estado nacional estable.",
                "Culmina con la caída del poder central tras Cepeda.",
            ],
        },
        {
            title: "Anarquía y autonomías provinciales",
            start: utcDate(1820, 2, 1),
            end: utcDate(1829, 12, 8),
            color: "#a9a28f", // trigo grisáceo (fragmentación)
            items: [
                "Disolución del poder central y soberanía de las provincias.",
                "Conflictos entre unitarios y federales.",
                "Pactos interprovinciales sin autoridad nacional efectiva.",
                "Fragmentación política generalizada.",
            ],
        },
        {
            title: "Primer gobierno de Rosas",
            start: utcDate(1829, 12, 8),
            end: utcDate(1832, 12, 17),
            color: "#9a6a61", // terracota apagado (inicio del orden rosista)
            items: [
                "Ascenso de Rosas como garante del orden en Buenos Aires.",
                "Centralización política con límites institucionales.",
                "Estabilización parcial tras la crisis previa.",
            ],
        },
        {
            title: "Inestabilidad y transición",
            start: utcDate(1832, 12, 17),
            end: utcDate(1835, 4, 13),
            color: "#b69a58", // trigo viejo (transición / inestabilidad)
            items: [
                "Crisis política tras la salida de Rosas.",
                "Incapacidad de sostener el orden sin liderazgo fuerte.",
                "Reconfiguración de alianzas y poder.",
            ],
        },
        {
            title: "Régimen rosista",
            start: utcDate(1835, 4, 13),
            end: utcDate(1852, 2, 3),
            color: "#8f4b3f", // rojo ladrillo sobrio (hegemonía rosista)
            items: [
                "Concentración del poder con la suma del poder público.",
                "Hegemonía de Buenos Aires sobre el resto del territorio.",
                "Orden político basado en liderazgo personal y coerción.",
                "Ausencia de organización constitucional nacional.",
                "Finaliza con la derrota en Caseros.",
            ],
        },
        {
            title: "Organización nacional sin Buenos Aires",
            start: utcDate(1852, 2, 3),
            end: utcDate(1860, 10, 1),
            color: "#325f87", // azul marino medio (institucionalización inicial)
            items: [
                "Caída de Rosas y apertura del proceso constitucional.",
                "Sanción de la Constitución de 1853.",
                "Formación de la Confederación Argentina.",
                "Buenos Aires permanece separada.",
            ],
        },
        {
            title: "Unificación y construcción del Estado nacional",
            start: utcDate(1860, 10, 1),
            end: utcDate(1880, 1, 1),
            color: "#4f7257", // verde institucional apagado (construcción del Estado)
            items: [
                "Incorporación de Buenos Aires al orden constitucional.",
                "Conflictos internos por la hegemonía política.",
                "Centralización progresiva del poder nacional.",
                "Formación efectiva del Estado argentino.",
            ],
        },
        {
            title: "Consolidación del modelo agroexportador",
            /* Inicio alineado con la reunificación bajo la Constitución (evita solape 1860-01..1860-10 con “Unificación”). */
            start: utcDate(1860, 10, 1),
            end: utcDate(1914, 1, 1),
            color: "#7e6b5a",
            items: [
                "Inserción de Argentina en el mercado mundial como exportador de materias primas.",
                "Expansión ganadera y agrícola en la pampa húmeda.",
                "Dependencia del capital y mercados externos.",
            ],
        },
        {
            title: "Expansión y control territorial del Estado",
            start: utcDate(1865, 1, 1),
            end: utcDate(1884, 1, 1),
            color: "#9d8258",
            items: [
                "Construcción del monopolio de la violencia estatal.",
                "Expansión sobre territorios indígenas (sur y norte).",
                "Definición de fronteras internas y externas.",
                "Condición material para el modelo agroexportador.",
            ],
        },
        {
            title: "Consolidación del Estado nacional",
            start: utcDate(1880, 1, 1),
            end: utcDate(1900, 1, 1),
            color: "#4e5a63", // gris azulado (orden consolidado)
            items: [
                "Fin de las guerras civiles; la Nación fija la capital federal en Buenos Aires (1880).",
                "Estabilización del orden político nacional.",
                "Consolidación del modelo agroexportador.",
            ],
        },
        {
            title: "Régimen oligárquico",
            start: utcDate(1880, 1, 1),
            end: utcDate(1916, 1, 1),
            color: "#354253",
            items: [
                "Dominio político de la élite terrateniente.",
                "Sistema electoral restringido y fraudulento.",
                "Estado funcional al modelo agroexportador.",
            ],
        },
        {
            title: "Inmigración masiva y transformación social",
            start: utcDate(1880, 1, 1),
            end: utcDate(1914, 7, 28),
            color: "#5f817f",
            items: [
                "Llegada masiva de inmigrantes europeos.",
                "Rápida urbanización y crecimiento de Buenos Aires.",
                "Formación de una clase trabajadora.",
                "Cambios culturales y sociales profundos.",
            ],
        },
    ],

    events: withEventIds([
        {
            title: "Revolución de Mayo",
            importance: "primary",
            summary:
                "Primer gobierno criollo en Buenos Aires: ruptura con el virreinato y apertura de un proceso revolucionario.",
            lanes: ["politico"],
            items: [
                "Habilitado por la invasión napoleónica a España en 1808 que crea vacío de poder.",
                "Remoción del virrey realista Cisneros.",
                "Formación de la Primera Junta (Saavedra, Moreno, Belgrano, etc.).",
                "Primer gobierno criollo, gobierno de facto de la Argentina.",
            ],
            date: utcDate(1810, 5, 25),
            links: ["https://es.wikipedia.org/wiki/Revoluci%C3%B3n_de_Mayo"],
        },
        {
            title: "Declaración de Independencia",
            importance: "primary",
            summary: "Acto formal de ruptura con la monarquía española en el Congreso de Tucumán.",
            lanes: ["politico", "diplomatico"],
            items: ["La Argentina se declara independiente del Reino de España."],
            date: utcDate(1816, 7, 9),
            links: ["https://es.wikipedia.org/wiki/Declaraci%C3%B3n_de_independencia_de_la_Argentina"],
        },
        {
            title: "Constitución fallida de 1819",
            lanes: ["politico"],
            items: [
                "Constitución de 1819 fallida por la oposición de las provincias.",
                "Deriva en la 'anarquía del 20'.",
            ],
            date: utcDate(1819, 5, 25),
            links: ["https://es.wikipedia.org/wiki/Constituci%C3%B3n_argentina_de_1819"],
        },
        {
            title: "Batalla de Cepeda (1820)",
            lanes: ["militar", "politico"],
            items: [
                "Derrota del Directorio frente a las fuerzas federales.",
                "Caída del poder central.",
                "Inicio efectivo de la anarquía del 20.",
            ],
            date: utcDate(1820, 2, 1),
        },
        {
            title: "Presidencia de Rivadavia",
            lanes: ["politico"],
            items: [
                "Intento de reconstrucción del poder central.",
                "Proyecto unitario y centralista.",
                "Fracasa por oposición provincial.",
            ],
            date: utcDate(1826, 2, 8),
        },
        {
            title: "Crisis de 1828 y ascenso de Rosas",
            lanes: ["politico", "militar"],
            items: [
                "Derrota de Dorrego en Navarro frente a Lavalle.",
                "Fusilamiento del gobernador federal y ruptura del orden político.",
                "Reacción federal que culmina con la designación de Rosas en 1829.",
            ],
            date: utcDate(1828, 12, 1),
        },
        {
            title: "Fin del primer mandato de Rosas",
            lanes: ["politico"],
            items: [
                "Finaliza el gobierno de Rosas al vencer su mandato como gobernador de Buenos Aires.",
                "Rechaza continuar al no obtener la suma del poder público (facultades extraordinarias).",
                "Abre un período de inestabilidad política que refuerza su posición para el regreso en 1835.",
            ],
            date: utcDate(1832, 12, 17),
            links: ["https://es.wikipedia.org/wiki/Juan_Manuel_de_Rosas"],
        },
        {
            title: "Vuelta de Obligado",
            summary:
                "Resistencia armada al paso de la escuadra anglo-francesa: conflicto por el control de los ríos y el comercio.",
            lanes: ["militar", "politico", "diplomatico"],
            items: [
                "Enfrentamiento contra la flota anglo-francesa en el río Paraná.",
                "Defensa de la soberanía sobre los ríos interiores.",
                "Aunque es derrota militar, fortalece la posición diplomática argentina.",
            ],
            date: utcDate(1845, 11, 20),
            links: ["https://es.wikipedia.org/wiki/Batalla_de_la_Vuelta_de_Obligado"],
        },
        {
            title: "Tratados que ponen fin a los bloqueos anglo-franceses",
            causes: ["Vuelta de Obligado"],
            summary:
                "Cierre diplomático de la crisis del Plata: reconocimiento de la navegación y apertura comercial.",
            lanes: ["politico", "economico", "diplomatico"],
            items: [
                "Acuerdos con Francia e Inglaterra que reconocen la soberanía argentina sobre los ríos.",
                "Fin de la intervención directa de potencias extranjeras.",
                "Consolidación de la autonomía en política exterior.",
            ],
            date: utcDate(1850, 1, 1),
            links: ["https://es.wikipedia.org/wiki/Bloqueo_anglo-franc%C3%A9s_del_R%C3%ADo_de_la_Plata"],
        },
        {
            title: "Batalla de Caseros",
            importance: "primary",
            summary:
                "Caída de Rosas: fin de la hegemonía porteña unilateral y paso hacia un pacto entre provincias.",
            lanes: ["militar", "politico"],
            consequences: ["Acuerdo de San Nicolás"],
            items: [
                "Derrota de Rosas frente a las fuerzas de Urquiza.",
                "Fin del régimen rosista basado en la concentración del poder en Buenos Aires.",
                "Marca el cierre de una etapa de orden político sin organización nacional formal.",
                "Da inicio al proceso de organización constitucional del Estado argentino.",
            ],
            date: utcDate(1852, 2, 3),
            links: ["https://es.wikipedia.org/wiki/Batalla_de_Caseros"],
        },
        {
            title: "Acuerdo de San Nicolás",
            causes: ["Batalla de Caseros"],
            consequences: ["Constitución de 1853"],
            summary: "Pacto federal que convoca al constituyente y delega liderazgo en Urquiza.",
            lanes: ["politico"],
            items: [
                "Pacto entre las provincias impulsado por Urquiza tras la caída de Rosas.",
                "Convoca a un Congreso Constituyente para organizar el Estado nacional.",
                "Establece bases federales y delega la conducción del proceso en Urquiza.",
                "Funciona como paso político inmediato hacia la Constitución de 1853.",
            ],
            date: utcDate(1852, 5, 31),
            links: ["https://es.wikipedia.org/wiki/Acuerdo_de_San_Nicol%C3%A1s"],
        },
        {
            title: "Constitución de 1853",
            causes: ["Acuerdo de San Nicolás"],
            consequences: ["Incorporación de Buenos Aires a la Constitución Nacional"],
            summary: "Marco institucional del Estado nacional; Buenos Aires queda fuera hasta 1860.",
            lanes: ["politico"],
            items: [
                "Define un marco con instituciones centralizadas y un Estado nacional.",
                "Buenos Aires queda separada, pero la unidad nacional se consolida.",
            ],
            date: utcDate(1853, 5, 1),
            links: ["https://es.wikipedia.org/wiki/Constituci%C3%B3n_argentina_de_1853"],
        },
        {
            title: "Batalla de Cepeda",
            lanes: ["militar", "politico"],
            items: [
                "Derrota del Estado de Buenos Aires frente a la Confederación liderada por Urquiza.",
                "Obliga a Buenos Aires a negociar su reincorporación.",
                "Funciona como condición de posibilidad del Pacto de San José de Flores.",
            ],
            date: utcDate(1859, 10, 23),
            links: ["https://es.wikipedia.org/wiki/Batalla_de_Cepeda_(1859)"],
        },
        {
            title: "Incorporación de Buenos Aires a la Constitución Nacional",
            causes: ["Constitución de 1853", "Batalla de Cepeda"],
            summary: "Reincorporación porteña al orden nacional tras el pacto de San José de Flores.",
            lanes: ["politico"],
            items: [
                "Buenos Aires acepta integrarse a la Confederación tras el Pacto de San José de Flores.",
                "Se reforma la Constitución para permitir su incorporación.",
                "Marca la unificación formal del país bajo un mismo orden constitucional.",
            ],
            date: utcDate(1860, 10, 1),
            links: ["https://es.wikipedia.org/wiki/Pacto_de_San_Jos%C3%A9_de_Flores"],
        },
        {
            title: "Batalla de Pavón",
            importance: "primary",
            summary:
                "Victoria bonaerense sobre la Confederación: Urquiza no profunda el choque; triunfo político del Estado de Buenos Aires.",
            /* Un solo carril: con dos, el visor dibuja dos marcas el mismo día (militar + político). */
            lanes: ["militar"],
            causes: ["Batalla de Cepeda"],
            consequences: ["Asunción de Bartolomé Mitre"],
            items: [
                "Enfrentamiento entre Buenos Aires y la Confederación.",
                "El repliegue de Urquiza permite la victoria política porteña.",
                "Abre el camino a la organización del Estado nacional bajo hegemonía de Buenos Aires.",
            ],
            date: utcDate(1861, 9, 17),
        },
        {
            title: "Asunción de Bartolomé Mitre",
            importance: "primary",
            summary:
                "Presidencia que expresa la hegemonía porteña y la organización efectiva del Estado nacional unificado.",
            lanes: ["politico"],
            causes: ["Batalla de Pavón"],
            consequences: ["Expansión ferroviaria"],
            items: [
                "Primer presidente del país unificado tras la derrota de la Confederación.",
                "Buenos Aires impone su proyecto político e institucional al resto del territorio.",
                "Inicio efectivo de la organización del Estado nacional centralizado.",
            ],
            date: utcDate(1862, 10, 12),
        },
        {
            title: "Expansión ferroviaria",
            causes: ["Asunción de Bartolomé Mitre"],
            summary: "Integración material del territorio al puerto y al modelo exportador (capital extranjero).",
            lanes: ["economico", "politico"],
            items: [
                "Desarrollo de la red ferroviaria con capital británico.",
                "Conecta regiones productivas con el puerto de Buenos Aires.",
                "Base material del modelo agroexportador.",
            ],
            date: utcDate(1865, 1, 1),
        },
        {
            title: "Guerra del Paraguay",
            summary: "Coalición regional (Triple Alianza): despliegue del ejército nacional y posición en el Plata.",
            lanes: ["militar", "politico", "diplomatico"],
            items: [
                "Conflicto regional que consolida el rol militar del Estado argentino.",
                "Fortalece al ejército nacional.",
                "Afianza la inserción de Argentina en el sistema regional.",
            ],
            date: utcDate(1865, 5, 1),
            links: ["https://es.wikipedia.org/wiki/Guerra_de_la_Triple_Alianza"],
        },
        {
            title: "Ingreso masivo de capitales británicos",
            lanes: ["economico"],
            items: [
                "Capitales ingleses financian ferrocarriles, bancos, comercio y servicios públicos.",
                "Financiamiento externo de infraestructura y producción; profundiza la dependencia económica.",
                "Gran Bretaña como socio central del modelo agroexportador.",
            ],
            date: utcDate(1870, 1, 1),
        },
        {
            title: "Zanja de Alsina",
            lanes: ["militar", "politico"],
            items: [
                "Sistema defensivo para contener el avance indígena en la frontera sur.",
                "Primer intento sistemático de control territorial estatal.",
                "Preludio de la Campaña del Desierto.",
            ],
            date: utcDate(1876, 1, 1),
            links: ["https://es.wikipedia.org/wiki/Zanja_de_Alsina"],
        },
        {
            title: "Ley de Inmigración y Colonización",
            lanes: ["social", "economico", "politico"],
            items: [
                "Fomento estatal a la inmigración europea.",
                "Base demográfica del modelo agroexportador.",
            ],
            date: utcDate(1876, 10, 19),
        },
        {
            title: "Primeras huelgas obreras",
            lanes: ["social"],
            items: [
                "Conflictos entre capital y trabajo en ámbitos urbanos y portuarios (olas posteriores, p. ej. 1888, amplían la protesta).",
                "Participación de trabajadores inmigrantes.",
                "Expresa tensiones del proceso de modernización.",
            ],
            date: utcDate(1878, 1, 1),
        },
        {
            title: "Campaña del Desierto",
            lanes: ["militar", "politico", "economico", "social"],
            items: [
                "Campaña militar liderada por Roca para ocupar territorios indígenas.",
                "Incorporación efectiva de la Patagonia al Estado nacional.",
                "Base territorial del modelo agroexportador.",
            ],
            date: utcDate(1879, 1, 1),
            links: ["https://es.wikipedia.org/wiki/Conquista_del_Desierto"],
        },
        {
            title: "Primera gran oleada de inmigración masiva",
            lanes: ["social", "economico"],
            items: [
                "Llegan grandes contingentes de inmigrantes europeos atraídos por la expansión económica.",
                "Aportan mano de obra al campo, al puerto y a las ciudades en crecimiento.",
                "Transforman la estructura social y alimentan nuevas tensiones urbanas y laborales.",
            ],
            date: utcDate(1880, 1, 1),
        },
        {
            title: "Federalización de Buenos Aires",
            lanes: ["politico"],
            items: [
                "La ciudad de Buenos Aires pasa a ser capital federal de la República.",
                "Se resuelve institucionalmente el conflicto histórico entre la provincia y el poder central.",
                "Consolida la autoridad del Estado nacional sobre el principal centro político y económico.",
            ],
            date: utcDate(1880, 9, 21),
            links: ["https://es.wikipedia.org/wiki/Federalizaci%C3%B3n_de_Buenos_Aires"],
        },
        {
            title: "Conquista del Chaco",
            lanes: ["militar", "politico", "economico", "social"],
            items: [
                "Avance militar sobre territorios del norte (Gran Chaco).",
                "Completa el control territorial interno del Estado.",
                "Integra regiones periféricas al orden nacional.",
            ],
            date: utcDate(1884, 1, 1),
            links: ["https://es.wikipedia.org/wiki/Conquista_del_Chaco"],
        },
        {
            title: "Formación del movimiento obrero organizado",
            lanes: ["social", "politico"],
            items: [
                "Difusión de ideas anarquistas y socialistas.",
                "Organización sindical de trabajadores.",
                "Respuesta a las condiciones del modelo agroexportador.",
            ],
            date: utcDate(1890, 1, 1),
        },
        {
            title: "Crisis económica de 1890",
            lanes: ["economico"],
            items: [
                "Colapso financiero vinculado a la banca Baring Brothers.",
                "Evidencia la fragilidad del modelo agroexportador.",
                "Expone la dependencia del capital externo.",
            ],
            date: utcDate(1890, 7, 1),
        },
        {
            title: "Revolución del Parque",
            lanes: ["politico", "militar"],
            items: [
                "Levantamiento cívico-militar contra el régimen conservador.",
                "Expresa el rechazo al fraude, la corrupción y el control oligárquico del sistema político.",
                "Marca el comienzo de una oposición política moderna al régimen.",
            ],
            date: utcDate(1890, 7, 26),
        },
        {
            title: "Crisis de la Baring Brothers",
            lanes: ["economico"],
            items: [
                "Estalla una crisis financiera internacional vinculada al endeudamiento argentino.",
                "Queda expuesta la vulnerabilidad del crecimiento basado en crédito externo y capital británico.",
                "La crisis muestra la fragilidad estructural del modelo agroexportador.",
            ],
            date: utcDate(1890, 11, 1),
        },
        {
            title: "Fundación de la Unión Cívica Radical",
            lanes: ["politico"],
            items: [
                "Se organiza una fuerza opositora con base en la denuncia del fraude electoral.",
                "La UCR cuestiona la legitimidad del orden político oligárquico.",
                "Se convierte en el principal canal de demanda por democratización.",
            ],
            date: utcDate(1891, 6, 26),
        },
        {
            title: "Abstención electoral radical",
            lanes: ["politico"],
            items: [
                "La UCR rechaza participar en elecciones consideradas fraudulentas.",
                "La abstención busca deslegitimar al régimen y forzar una reforma política.",
                "La práctica expresa la imposibilidad de competencia real dentro del sistema vigente.",
            ],
            date: utcDate(1892, 1, 1),
        },
        {
            title: "Revoluciones radicales",
            lanes: ["politico", "militar"],
            items: [
                "Sectores radicales impulsan levantamientos armados contra el régimen conservador.",
                "Las insurrecciones muestran que la crisis política no podía resolverse dentro del sistema fraudulento.",
                "Preparan el terreno para la futura reforma electoral.",
            ],
            date: utcDate(1893, 1, 1),
        },
        {
            title: "Formación del socialismo argentino",
            lanes: ["social", "politico"],
            items: [
                "Surgen corrientes políticas obreras vinculadas al socialismo y al anarquismo.",
                "Se organiza una nueva representación de intereses de trabajadores urbanos.",
                "El conflicto social entra de lleno en la política argentina moderna.",
            ],
            date: utcDate(1896, 6, 28),
        },
        {
            title: "Ley Sáenz Peña",
            lanes: ["politico", "social"],
            items: [
                "Establece el voto secreto, obligatorio y universal (masculino).",
                "Reduce el fraude electoral.",
                "Abre el sistema político a nuevos sectores.",
            ],
            date: utcDate(1912, 2, 10),
            links: ["https://es.wikipedia.org/wiki/Ley_S%C3%A1enz_Pe%C3%B1a"],
        },
        {
            title: "Elección de Yrigoyen",
            lanes: ["politico", "social"],
            items: [
                "Primera elección presidencial bajo la Ley Sáenz Peña.",
                "Triunfo de la Unión Cívica Radical.",
                "Fin del orden oligárquico clásico.",
            ],
            date: utcDate(1916, 4, 2),
            links: ["https://es.wikipedia.org/wiki/Hip%C3%B3lito_Yrigoyen"],
        },
    ]),
};
