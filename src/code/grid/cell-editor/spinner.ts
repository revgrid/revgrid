
import { RenderedCell } from '../cell/rendered-cell';
import { Revgrid } from '../revgrid';
import { CellEditor } from './cell-editor';

export class Spinner extends CellEditor {
    constructor(grid: Revgrid, renderedCell: RenderedCell) {
        const element = document.createElement('input') as HTMLInputElement;
        element.type = 'number';

        super(grid, renderedCell, element);
    }
}

// const template = '<input type="number" lang="{{locale}}" style="{{style}}">'


export namespace Spinner {
    export const typeName = 'Spinner';
}
