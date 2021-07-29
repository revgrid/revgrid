
import { Hypergrid } from '../grid/hypergrid';
import { Canvas } from '../lib/canvas';
import { Feature } from './feature';

/**
 * @typedef {import("../Hypergrid")} Hypergrid
 */

const commands: KeyPaging.CommandMap = {
    PAGEDOWN: (grid: Hypergrid) => { grid.pageDown(); },
    PAGEUP: (grid: Hypergrid) => { grid.pageUp(); },
    PAGELEFT: (grid: Hypergrid) => { grid.pageLeft(); },
    PAGERIGHT: (grid: Hypergrid) => { grid.pageRight(); }
};

/**
 * @constructor
 */
export class KeyPaging extends Feature {

    readonly typeName = KeyPaging.typeName;

    /**
     * @param {Hypergrid} grid
     * @param {Object} event - the event details
     * @memberOf KeyPaging.prototype
     */
    override handleKeyDown(grid: Hypergrid, event: Canvas.KeyboardSyntheticEvent) {
        const detail = event.detail;
        const func = commands[detail.char];
        if (func) {
            func(grid);
        } else if (this.next) {
            this.next.handleKeyDown(grid, event);
        }
    }

}

export namespace KeyPaging {
    export const typeName = 'keypaging';

    export type CommandFunction = (this: void, grid: Hypergrid) => void;
    export interface CommandMap {
        [command: string]: CommandFunction;
        PAGEDOWN: CommandFunction;
        PAGEUP: CommandFunction;
        PAGELEFT: CommandFunction;
        PAGERIGHT: CommandFunction;
    }
}
