import { Hypergrid } from '../grid/hypergrid';

export class SelectionDetailAccessor {
    constructor(public readonly grid: Hypergrid) {

    }

    get rows() { return this.grid.getSelectedRows(); }
    get columns() { return this.grid.getSelectedColumns(); }
    get selections() { return this.grid.selectionModel.getSelections(); }
}
