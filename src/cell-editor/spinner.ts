
import { Hypergrid } from '../grid/hypergrid';
import { CellEvent } from '../lib/cell-event';
import { CellEditor } from './cell-editor';

export class Spinner extends CellEditor {
    constructor(grid: Hypergrid, options: CellEvent) {
        super(grid, options, template);
    }
}

const template = '<input type="number" lang="{{locale}}" style="{{style}}">'


export namespace Spinner {
    export const typeName = 'Spinner';
}
