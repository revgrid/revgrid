
/** @public */
export interface RevDatalessSubgrid {
    readonly role: RevDatalessSubgrid.Role;

    readonly isMain: boolean;
    readonly isHeader: boolean;
    readonly isFilter: boolean;
    readonly isSummary: boolean;
    readonly isFooter: boolean;

    readonly selectable: boolean;

    readonly rowHeightsCanDiffer: boolean;
    readonly fixedRowCount: number;

    isRowFixed(rowIndex: number): boolean;
}

/** @public */
export namespace RevDatalessSubgrid {
    export type Role =
        typeof Role.header |
        typeof Role.filter |
        typeof Role.main |
        typeof Role.summary |
        typeof Role.footer;

    export namespace Role {
        export const header = 'header';
        export const filter = 'filter';
        export const main = 'main';
        export const summary = 'summary';
        export const footer = 'footer';

        export const defaultRole = main;

        const gridOrder: Role[] = [
            header,
            filter,
            main,
            summary,
            footer,
        ];

        export function gridOrderCompare(left: Role | undefined, right: Role | undefined) {
            return gridOrder.indexOf(left ?? defaultRole) - gridOrder.indexOf(right ?? defaultRole);
        }
    }
}
