
import { RenderedCell } from '../cell/rendered-cell';
import { Revgrid } from '../revgrid';
import { CellEditor } from './cell-editor';

export class Slider extends CellEditor {
    constructor(grid: Revgrid, renderedCell: RenderedCell) {
        const element = document.createElement('input') as HTMLInputElement;
        element.type = 'range';

        super(grid, renderedCell, element);
    }
}

// const template = '<input type="range" lang="{{locale}}" style="{{style}}">'


export namespace Slider {
    export const typeName = 'Slider';
}
