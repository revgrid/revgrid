
import { RenderedCell } from '../cell/rendered-cell';
import { Revgrid } from '../revgrid';
import { CellEditor } from './cell-editor';

/**
 * As of spring 2016:
 * Functions well in Chrome and Firefox; unimplemented in Safari.
 */
export class Color extends CellEditor {
    constructor(grid: Revgrid, renderedCell: RenderedCell) {
        const element = document.createElement('input') as HTMLInputElement;
        element.type = 'color';

        super(grid, renderedCell, element);
    }
}

// template = '<input type="color" lang="{{locale}}" style="{{style}}">'

export namespace Color {
    export const typeName = 'Color';
}
