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
            description: `
                - Ruptura del orden colonial con la Revolución de Mayo.
                - Intentos fallidos de centralización (Directorio).
                - Independencia sin construcción de un Estado nacional estable.
                - Culmina con la caída del poder central tras Cepeda.
            `,
        },
        {
            title: "Anarquía y autonomías provinciales",
            start: utcDate(1820, 2, 1),
            end: utcDate(1829, 12, 8),
            color: "#ADB5BD", // gris claro (fragmentación)
            description: `
                - Disolución del poder central y soberanía de las provincias.
                - Conflictos entre unitarios y federales.
                - Pactos interprovinciales sin autoridad nacional efectiva.
                - Fragmentación política generalizada.
            `,
        },
        {
            title: "Primer gobierno de Rosas",
            start: utcDate(1829, 12, 8),
            end: utcDate(1832, 12, 17),
            color: "#F08A8A", // rojo claro (inicio del orden rosista)
            description: `
              - Ascenso de Rosas como garante del orden en Buenos Aires.
              - Centralización política con límites institucionales.
              - Estabilización parcial tras la crisis previa.
            `,
        },
        {
            title: "Inestabilidad y transición",
            start: utcDate(1832, 12, 17),
            end: utcDate(1835, 4, 13),
            color: "#FFE066", // amarillo (transición / inestabilidad)
            description: `
                - Crisis política tras la salida de Rosas.
                - Incapacidad de sostener el orden sin liderazgo fuerte.
                - Reconfiguración de alianzas y poder.
            `,
        },
        {
            title: "Régimen rosista",
            start: utcDate(1835, 4, 13),
            end: utcDate(1852, 2, 3),
            color: "#C1121F", // rojo intenso (hegemonía rosista)
            description: `
            - Concentración del poder con la suma del poder público.
            - Hegemonía de Buenos Aires sobre el resto del territorio.
            - Orden político basado en liderazgo personal y coerción.
            - Ausencia de organización constitucional nacional.
            - Finaliza con la derrota en Caseros.
        `,
        },
        {
            title: "Organización nacional sin Buenos Aires",
            start: utcDate(1852, 2, 3),
            end: utcDate(1860, 10, 1),
            color: "#1971C2", // azul (institucionalización inicial)
            description: `
                - Caída de Rosas y apertura del proceso constitucional.
                - Sanción de la Constitución de 1853.
                - Formación de la Confederación Argentina.
                - Buenos Aires permanece separada.
            `,
        },
        {
            title: "Unificación y construcción del Estado nacional",
            start: utcDate(1860, 10, 1),
            end: utcDate(1880, 1, 1),
            color: "#2B8A3E", // verde (construcción del Estado)
            description: `
            - Incorporación de Buenos Aires al orden constitucional.
            - Conflictos internos por la hegemonía política.
            - Centralización progresiva del poder nacional.
            - Formación efectiva del Estado argentino.
        `,
        },
        {
            title: "Consolidación del Estado nacional",
            start: utcDate(1880, 1, 1),
            end: utcDate(1900, 1, 1),
            color: "#495057", // gris oscuro (orden consolidado)
            description: `
                - Federalización de Buenos Aires.
                - Fin de las guerras civiles.
                - Estabilización del orden político nacional.
                - Consolidación del modelo agroexportador.
            `,
        },
    ],

    events: [
        {
            title: "Revolución de Mayo",
            description: `
                - Habilitado por la invasión Napoelónica a España en 1808 que crea vacío de poder.
                - Remoción del virrey realista Cisneros.
                - Formación de la Primera Junta (Saavedra, Moreno, Belgrano, etc.).
                - Primer gobierno criollo, gobierno de facto de la Argentina.
            `,
            date: utcDate(1810, 5, 25),
            links: ["https://es.wikipedia.org/wiki/Revoluci%C3%B3n_de_Mayo"]
        },
        {
            title: "Declaración de Independencia",
            description: "La Argentina se declara independiente del Reino de España.",
            date: utcDate(1816, 7, 9),
            links: ["https://es.wikipedia.org/wiki/Declaraci%C3%B3n_de_independencia_de_la_Argentina"]
        },
        {
            title: "Constitución fallida de 1819",
            description: `
                - Constitución de 1819 fallida por la oposición de las provincias.
                - Deriva en la 'anarquía del 20'.
            `,
            date: utcDate(1819, 5, 25),
            links: ["https://es.wikipedia.org/wiki/Constituci%C3%B3n_argentina_de_1819"],
        },
        {
            title: "Crisis de 1828 y ascenso de Rosas",
            description: `
                - Derrota de Dorrego en Navarro frente a Lavalle.
                - Fusilamiento del gobernador federal y ruptura del orden político.
                - Reacción federal que culmina con la designación de Rosas en 1829.
            `,
            date: utcDate(1828, 12, 1),
        },
        {
            title: "Fin del primer mandato de Rosas",
            description: `
                - Finaliza el gobierno de Rosas al vencer su mandato como gobernador de Buenos Aires.
                - Rechaza continuar al no obtener la suma del poder público (facultades extraordinarias).
                - Abre un período de inestabilidad política que refuerza su posición para el regreso en 1835.
            `,
            date: utcDate(1832, 12, 17),
            links: ["https://es.wikipedia.org/wiki/Juan_Manuel_de_Rosas"],
        },
        {
            title: "Batalla de Caseros",
            description: `
                - Derrota de Rosas frente a las fuerzas de Urquiza.
                - Fin del régimen rosista basado en la concentración del poder en Buenos Aires.
                - Marca el cierre de una etapa de orden político sin organización nacional formal.
                - Da inicio al proceso de organización constitucional del Estado argentino.
            `,
            date: utcDate(1852, 2, 3),
            links: ["https://es.wikipedia.org/wiki/Batalla_de_Caseros"],
        },
        {
            title: "Acuerdo de San Nicolás",
            description: `
                - Pacto entre las provincias impulsado por Urquiza tras la caída de Rosas.
                - Convoca a un Congreso Constituyente para organizar el Estado nacional.
                - Establece bases federales y delega la conducción del proceso en Urquiza.
                - Funciona como paso político inmediato hacia la Constitución de 1853.
            `,
            date: utcDate(1852, 5, 31),
            links: ["https://es.wikipedia.org/wiki/Acuerdo_de_San_Nicol%C3%A1s"],
        },
        {
            title: "Constitución de 1853",
            description: `
                - Define un marco con instituciones centralizadas y un Estado nacional.
                - Buenos Aires queda separada, pero la unidad nacional se consolida.
            `,
            date: utcDate(1853, 5, 1),
            links: ["https://es.wikipedia.org/wiki/Constituci%C3%B3n_argentina_de_1853"],
        },
        {
            title: "Batalla de Cepeda",
            description: `
                - Derrota del Estado de Buenos Aires frente a la Confederación liderada por Urquiza.
                - Obliga a Buenos Aires a negociar su reincorporación.
                - Funciona como condición de posibilidad del Pacto de San José de Flores.
            `,
            date: utcDate(1859, 10, 23),
            links: ["https://es.wikipedia.org/wiki/Batalla_de_Cepeda_(1859)"],
        },
        {
            title: "Incorporación de Buenos Aires a la Constitución Nacional",
            description: `
                - Buenos Aires acepta integrarse a la Confederación tras el Pacto de San José de Flores.
                - Se reforma la Constitución para permitir su incorporación.
                - Marca la unificación formal del país bajo un mismo orden constitucional.
            `,
            date: utcDate(1860, 10, 1),
            links: ["https://es.wikipedia.org/wiki/Pacto_de_San_Jos%C3%A9_de_Flores"],
        },
    ],
};