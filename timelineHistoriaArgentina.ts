import { Timeline } from "./types";

/** Fecha civil gregoriana en UTC (mediodía), sin corrimiento por zona del navegador. */
function utcDate(year: number, month: number, day: number): Date {
    return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export const timelineHistoriaArgentina: Timeline = {
    periods: [
        {
            title: "Etapa de organización nacional",
            start: utcDate(1810, 5, 25),
            end: utcDate(1880, 1, 1),
            description: `
                - Abre con la Revolución de Mayo de 1810 que termina con el orden colonial
                - Culmina con la federalización de las provincias en 1880.
                - Caracterizada por la guerra civil entre las provincias y el Estado nacional
                - Caudillos provinciales vs. centralismo nacional.
                - Unitarios vs. federales.
                - Constitución de 1853 como hito de la unidad nacional
            `
        },
        {
            title: "Orden Rosista",
            start: utcDate(1829, 12, 8),
            end: utcDate(1852, 4, 13),
            description: `
                - Gobierno de facto de Juan Manuel de Rosas.
                - Centralización sin Estado nacional formal.
                - Federalismo práctico, hegemonía porteña.
                - Autoritarismo, persecución política de opositores (Mazorca).
                - Estabilidad tras decadas de guerra civil.
                - Aislamiento y conflicto externo: bloqueos francés e inglés y conflictos regionales
                - Depedencia en el liderazgo personal de Rosas
                - Culmina con la derrota en la Batalla de Caseros
            `,
        }
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
            title: "Constitución de 1853",
            description: `
                - Define un marco con instituciones centralizadas y un Estado nacional.A
                - Buenos Aires queda separada, pero la unidad nacional se consolida.
            `,
            date: utcDate(1853, 5, 1),
            links: ["https://es.wikipedia.org/wiki/Constituci%C3%B3n_argentina_de_1853"],
        },
        {
            title: "Batalla de Pavón",
            description: `
                - Buenos Aires dirigida por Bartolomé Mitre vs. Confederación Argentina dirigida por Justo José de Urquiza.
                - Derrota de Rosas, pero la unidad nacional se consolida.
                - Urquiza abandona la confrontación y deja el camino libre a Buenos Aires.
                - Federal formalmente, unitario de facto con Buenos Aires concentrando recursos (aduana), el poder político y el liderazgo estatal.
            `,
            date: utcDate(1861, 9, 17),
            links: ["https://es.wikipedia.org/wiki/Batalla_de_Pav%C3%B3n"]
        }
    ],
};