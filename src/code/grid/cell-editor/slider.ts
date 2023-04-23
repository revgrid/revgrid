
import { ViewportCell } from '../cell/viewport-cell';
import { Revgrid } from '../revgrid';
import { RangeInputEditor } from './range-input-editor';

export class Slider extends RangeInputEditor {
    constructor(grid: Revgrid, renderedCell: ViewportCell) {
        super(grid, renderedCell);
    }
}

// const template = '<input type="range" lang="{{locale}}" style="{{style}}">'


export namespace Slider {
    export const typeName = 'Slider';
}
