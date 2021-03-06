
import { RenderedCell } from '../cell/rendered-cell';
import { Revgrid } from '../revgrid';
import { NumberInputEditor } from './number-input-editor';

export class Spinner extends NumberInputEditor {
    constructor(grid: Revgrid, renderedCell: RenderedCell) {
        super(grid, renderedCell);
    }
}

// const template = '<input type="number" lang="{{locale}}" style="{{style}}">'


export namespace Spinner {
    export const typeName = 'Spinner';
}
