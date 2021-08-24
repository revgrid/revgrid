import { Hypegrid } from '../grid/hypegrid';
import { Rectangle } from '../lib/rectangular';

/** @public */
export interface SelectionDetail {
    readonly rows: number[]
    readonly columns: number[]
    readonly selections: Rectangle[]
}

/** @internal */
export class SelectionDetailAccessor implements SelectionDetail {
    constructor(public readonly grid: Hypegrid) {

    }

    get rows() { return this.grid.getSelectedRows(); }
    get columns() { return this.grid.getSelectedColumns(); }
    get selections() { return this.grid.selectionModel.getSelections(); }
}
