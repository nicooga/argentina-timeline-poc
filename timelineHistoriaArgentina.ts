import { Timeline } from "./types";

/** Fecha civil gregoriana en UTC (mediodía), sin corrimiento por zona del navegador. */
function utcDate(year: number, month: number, day: number): Date {
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export const timelineHistoriaArgentina: Timeline = {
    periods: [
        {
            title: "Revolución y crisis del orden colonial",
            start: utcDate(1810, 5, 25),
            end: utcDate(1820, 2, 1),
            color: "#6C757D", // gris (ruptura / transición)
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
            color: "#ADB5BD", // gris claro (fragmentación)
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
            color: "#F08A8A", // rojo claro (inicio del orden rosista)
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
            color: "#FFE066", // amarillo (transición / inestabilidad)
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
            color: "#C1121F", // rojo intenso (hegemonía rosista)
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
            color: "#1971C2", // azul (institucionalización inicial)
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
            color: "#2B8A3E", // verde (construcción del Estado)
            items: [
                "Incorporación de Buenos Aires al orden constitucional.",
                "Conflictos internos por la hegemonía política.",
                "Centralización progresiva del poder nacional.",
                "Formación efectiva del Estado argentino.",
            ],
        },
        {
            title: "Consolidación del modelo agroexportador",
            start: utcDate(1860, 1, 1),
            end: utcDate(1914, 1, 1),
            color: "#8D6E63",
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
            color: "#A47148",
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
            color: "#495057", // gris oscuro (orden consolidado)
            items: [
                "Federalización de Buenos Aires.",
                "Fin de las guerras civiles.",
                "Estabilización del orden político nacional.",
                "Consolidación del modelo agroexportador.",
            ],
        },
        {
            title: "Régimen oligárquico",
            start: utcDate(1880, 1, 1),
            end: utcDate(1916, 1, 1),
            color: "#343A40",
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
            color: "#5F9EA0",
            items: [
                "Llegada masiva de inmigrantes europeos.",
                "Rápida urbanización y crecimiento de Buenos Aires.",
                "Formación de una clase trabajadora.",
                "Cambios culturales y sociales profundos.",
            ],
        },
    ],

    events: [
        {
            title: "Revolución de Mayo",
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
            items: ["La Argentina se declara independiente del Reino de España."],
            date: utcDate(1816, 7, 9),
            links: ["https://es.wikipedia.org/wiki/Declaraci%C3%B3n_de_independencia_de_la_Argentina"],
        },
        {
            title: "Constitución fallida de 1819",
            items: [
                "Constitución de 1819 fallida por la oposición de las provincias.",
                "Deriva en la 'anarquía del 20'.",
            ],
            date: utcDate(1819, 5, 25),
            links: ["https://es.wikipedia.org/wiki/Constituci%C3%B3n_argentina_de_1819"],
        },
        {
            title: "Crisis de 1828 y ascenso de Rosas",
            items: [
                "Derrota de Dorrego en Navarro frente a Lavalle.",
                "Fusilamiento del gobernador federal y ruptura del orden político.",
                "Reacción federal que culmina con la designación de Rosas en 1829.",
            ],
            date: utcDate(1828, 12, 1),
        },
        {
            title: "Fin del primer mandato de Rosas",
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
            items: [
                "Define un marco con instituciones centralizadas y un Estado nacional.",
                "Buenos Aires queda separada, pero la unidad nacional se consolida.",
            ],
            date: utcDate(1853, 5, 1),
            links: ["https://es.wikipedia.org/wiki/Constituci%C3%B3n_argentina_de_1853"],
        },
        {
            title: "Batalla de Cepeda",
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
            items: [
                "Buenos Aires acepta integrarse a la Confederación tras el Pacto de San José de Flores.",
                "Se reforma la Constitución para permitir su incorporación.",
                "Marca la unificación formal del país bajo un mismo orden constitucional.",
            ],
            date: utcDate(1860, 10, 1),
            links: ["https://es.wikipedia.org/wiki/Pacto_de_San_Jos%C3%A9_de_Flores"],
        },
        {
            title: "Guerra del Paraguay",
            items: [
                "Conflicto regional que consolida el rol militar del Estado argentino.",
                "Fortalece al ejército nacional.",
                "Afianza la inserción de Argentina en el sistema regional.",
            ],
            date: utcDate(1865, 5, 1),
            links: ["https://es.wikipedia.org/wiki/Guerra_de_la_Triple_Alianza"],
        },
        {
            title: "Zanja de Alsina",
            items: [
                "Sistema defensivo para contener el avance indígena en la frontera sur.",
                "Primer intento sistemático de control territorial estatal.",
                "Preludio de la Campaña del Desierto.",
            ],
            date: utcDate(1876, 1, 1),
            links: ["https://es.wikipedia.org/wiki/Zanja_de_Alsina"],
        },
        {
            title: "Campaña del Desierto",
            items: [
                "Campaña militar liderada por Roca para ocupar territorios indígenas.",
                "Incorporación efectiva de la Patagonia al Estado nacional.",
                "Base territorial del modelo agroexportador.",
            ],
            date: utcDate(1879, 1, 1),
            links: ["https://es.wikipedia.org/wiki/Conquista_del_Desierto"],
        },
        {
            title: "Federalización de Buenos Aires",
            items: [
                "Buenos Aires se convierte en capital federal.",
                "Resolución del conflicto entre Nación y provincia.",
                "Consolidación del poder del Estado nacional.",
            ],
            date: utcDate(1880, 9, 21),
            links: ["https://es.wikipedia.org/wiki/Federalizaci%C3%B3n_de_Buenos_Aires"],
        },
        {
            title: "Conquista del Chaco",
            items: [
                "Avance militar sobre territorios del norte (Gran Chaco).",
                "Completa el control territorial interno del Estado.",
                "Integra regiones periféricas al orden nacional.",
            ],
            date: utcDate(1884, 1, 1),
            links: ["https://es.wikipedia.org/wiki/Conquista_del_Chaco"],
        },
        {
            title: "Ley Sáenz Peña",
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
            items: [
                "Primera elección presidencial bajo la Ley Sáenz Peña.",
                "Triunfo de la Unión Cívica Radical.",
                "Fin del orden oligárquico clásico.",
            ],
            date: utcDate(1916, 4, 2),
            links: ["https://es.wikipedia.org/wiki/Hip%C3%B3lito_Yrigoyen"],
        },
        {
            title: "Batalla de Cepeda (1820)",
            items: [
                "Derrota del Directorio frente a las fuerzas federales.",
                "Caída del poder central.",
                "Inicio efectivo de la anarquía del 20.",
            ],
            date: utcDate(1820, 2, 1),
        },
        {
            title: "Presidencia de Rivadavia",
            items: [
                "Intento de reconstrucción del poder central.",
                "Proyecto unitario y centralista.",
                "Fracasa por oposición provincial.",
            ],
            date: utcDate(1826, 2, 8),
        },
        {
            title: "Batalla de Pavón",
            items: [
                "Enfrentamiento entre Buenos Aires y la Confederación.",
                "Retiro de Urquiza permite la victoria política porteña.",
                "Define la hegemonía de Buenos Aires.",
            ],
            date: utcDate(1861, 9, 17),
        },
        {
            title: "Presidencia de Mitre",
            items: [
                "Inicio del Estado nacional bajo hegemonía porteña.",
                "Unificación institucional efectiva.",
            ],
            date: utcDate(1862, 10, 12),
        },
        {
            title: "Ley de Inmigración y Colonización",
            items: [
                "Fomento estatal a la inmigración europea.",
                "Base demográfica del modelo agroexportador.",
            ],
            date: utcDate(1876, 10, 19),
        },
    ],
};
