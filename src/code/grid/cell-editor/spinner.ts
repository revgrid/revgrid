
import { ViewportCell } from '../cell/viewport-cell';
import { Revgrid } from '../revgrid';
import { NumberInputEditor } from './number-input-editor';

export class Spinner extends NumberInputEditor {
    constructor(grid: Revgrid, renderedCell: ViewportCell) {
        super(grid, renderedCell);
    }
}

// const template = '<input type="number" lang="{{locale}}" style="{{style}}">'


export namespace Spinner {
    export const typeName = 'Spinner';
}
