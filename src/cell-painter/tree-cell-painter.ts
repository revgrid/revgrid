
import { CanvasRenderingContext2DEx } from '../lib/canvas-rendering-context-2d-ex';
import { CellPainter } from './cell-painter';

/**
 * Renders a tree cell (presumably in the tree column).
 * @constructor
 */
export class TreeCellPainter extends CellPainter {
    override paint(gc: CanvasRenderingContext2DEx, config: CellPainter.Config) {
        const x = config.bounds.x;
        const y = config.bounds.y;
        const val = ['']; // config.value.data; // Not implemented
        const indent = 4; //config.value.indent; // Not implemented
        const icon = ''; // config.value.icon; // Not implemented

        // Fill background only if our bgColor is populated or we are a selected cell.
        if (config.backgroundColor || config.isSelected) {
            gc.cache.fillStyle = config.isSelected ? config.backgroundColor : config.backgroundColor;
            gc.fillRect(x, y, config.bounds.width, config.bounds.height);
        }

        if (!val || !val.length) {
            return;
        }

        gc.cache.fillStyle = config.isSelected ? config.backgroundColor : config.backgroundColor;

        const valignOffset = Math.ceil(config.bounds.height / 2);
        gc.fillText(icon + val, x + indent, y + valignOffset);

        config.minWidth = x + indent + gc.getTextWidth(icon + val) + 10;
    }
}

export namespace TreeCellPainter {
    export const typeName = 'TreeCell';
}
