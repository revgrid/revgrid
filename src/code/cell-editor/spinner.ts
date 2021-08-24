
import { Hypegrid } from '../grid/hypegrid';
import { CellEvent } from '../renderer/cell-event';
import { CellEditor } from './cell-editor';

export class Spinner extends CellEditor {
    constructor(grid: Hypegrid, options: CellEvent) {
        super(grid, options, template);
    }
}

const template = '<input type="number" lang="{{locale}}" style="{{style}}">'


export namespace Spinner {
    export const typeName = 'Spinner';
}
