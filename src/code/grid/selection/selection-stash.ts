/** @internal */
export class SelectionStash {
    constructor(
        readonly singleFirstCellPosition: SelectionStash.SingleFirstCellPosition | undefined,
        readonly allRowsSelected: boolean,
        readonly rowIds: unknown[] | undefined,
        readonly columnNames: string[] | undefined,
    ) {

    }
}

/** @internal */
export namespace SelectionStash {
    export interface SingleFirstCellPosition {
        columnName: string;
        rowId: unknown;
    }
}
