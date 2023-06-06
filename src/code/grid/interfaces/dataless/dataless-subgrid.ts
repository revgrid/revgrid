
/** @public */
export interface DatalessSubgrid {
    readonly role: DatalessSubgrid.Role;

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
export namespace DatalessSubgrid {
    export const enum RoleEnum {
        header = 'header',
        filter = 'filter',
        main = 'main',
        summary = 'summary',
        footer = 'footer',
    }

    export type Role = keyof typeof RoleEnum;

    export namespace Role {
        export const defaultRole = RoleEnum.main;

        const gridOrder: Role[] = [
            RoleEnum.header,
            RoleEnum.filter,
            RoleEnum.main,
            RoleEnum.summary,
            RoleEnum.footer,
        ];

        export function gridOrderCompare(left: Role | undefined, right: Role | undefined) {
            return gridOrder.indexOf(left ?? defaultRole) - gridOrder.indexOf(right ?? defaultRole);
        }
    }
}
