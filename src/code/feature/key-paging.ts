
import { Canvas } from '../canvas/canvas';
import { Hypegrid } from '../grid/hypegrid';
import { Feature } from './feature';

const commands: KeyPaging.CommandMap = {
    PAGEDOWN: (grid: Hypegrid) => { grid.pageDown(); },
    PAGEUP: (grid: Hypegrid) => { grid.pageUp(); },
    PAGELEFT: (grid: Hypegrid) => { grid.pageLeft(); },
    PAGERIGHT: (grid: Hypegrid) => { grid.pageRight(); }
};

/**
 * @constructor
 */
export class KeyPaging extends Feature {

    readonly typeName = KeyPaging.typeName;

    /**
     * @param event - the event details
     */
    override handleKeyDown(grid: Hypegrid, event: Canvas.KeyboardSyntheticEvent) {
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

    export type CommandFunction = (this: void, grid: Hypegrid) => void;
    export interface CommandMap {
        [command: string]: CommandFunction;
        PAGEDOWN: CommandFunction;
        PAGEUP: CommandFunction;
        PAGELEFT: CommandFunction;
        PAGERIGHT: CommandFunction;
    }
}
