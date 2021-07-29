
import { Hypergrid } from '../grid/hypergrid';
import { CellEvent } from '../lib/cell-event';
import { CellEditor } from './cell-editor';

/**
 * @constructor
 * @extends CellEditor
 */
export class Slider extends CellEditor {
    constructor(grid: Hypergrid, options: CellEvent) {
        super(grid, options, template);
    }
}

const template = '<input type="range" lang="{{locale}}" style="{{style}}">'


export namespace Slider {
    export const typeName = 'Slider';
}
