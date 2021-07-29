
import { CanvasRenderingContext2DEx } from '../lib/canvas-rendering-context-2d-ex';
import { CellPainter } from './cell-painter';

export class ErrorCellPainter extends CellPainter {

    /**
     * @summary Writes error message into cell.
     *
     * @desc This function is guaranteed to be called as follows:
     *
     * ```javascript
     * gc.save();
     * gc.beginPath();
     * gc.rect(x, y, width, height);
     * gc.clip();
     * behavior.getCellProvider().renderCellError(gc, message, x, y, width, height);
     * gc.restore();
     * ```
     *
     * Before doing anything else, this function should clear the cell by setting `gc.fillStyle` and calling `gc.fill()`.
     *
     * @param {Canvas.CanvasRenderingContext2DEx} gc TODO
     * @param {object} config
     * @param {Rectangle} config.bounds - The clipping rect of the cell to be rendered.
     * @memberOf ErrorCell.prototype
     */
    override paint(gc: CanvasRenderingContext2DEx, config: CellPainter.Config) {
        this.paintMessage(gc, config, ''); // this should never be called
    }

    paintMessage(gc: CanvasRenderingContext2DEx, config: CellPainter.Config, message: string) {
        const x = config.bounds.x;
        const y = config.bounds.y;
        // const width = config.bounds.width;
        const height = config.bounds.height;

        // clear the cell
        // (this makes use of the rect path defined by the caller)
        gc.cache.fillStyle = '#FFD500';
        gc.fill();

        // render message text
        gc.cache.fillStyle = '#A00';
        gc.cache.textAlign = 'start';
        gc.cache.textBaseline = 'middle';
        gc.cache.font = 'bold 6pt "arial narrow", verdana, geneva';
        gc.fillText(message, x + 4, y + height / 2 + 0.5);
    }
}

export namespace ErrorCellPainter {
    export const typeName = 'ErrorCell';
}
