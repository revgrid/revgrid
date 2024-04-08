import { CachedCanvasRenderingContext2D } from '../../types-utils/cached-canvas-rendering-context-2d';
import { DatalessViewCell } from '../dataless/dataless-view-cell';
import { SchemaField } from '../schema/schema-field';
import { BehavioredColumnSettings } from '../settings/behaviored-column-settings';
import { CellPossiblyPaintable } from './cell-possibly-paintable';

/**
 * Implementations of `CellPainter` are used to render the 2D graphics context within the bound of a cell.
 *
 * Implement this interface to implement your own cell painter.
 *
 * @public
 */
export interface CellPainter<BCS extends BehavioredColumnSettings, SF extends SchemaField> extends CellPossiblyPaintable<BCS, SF> {

    /**
     * An empty implementation of a cell renderer, see [the null object pattern](http://c2.com/cgi/wiki?NullObject).
     * @returns Preferred pixel width of content. The content may or may not be rendered at that width depending on whether or not `config.bounds` was respected and whether or not the grid renderer is using clipping. (Clipping is generally not used due to poor performance.)
     */
    paint(cell: DatalessViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined;

}

/** @public */
export namespace CellPainter {
    /**
     * A simple implementation of rounding a cell.
     * @param x - the x grid coordinate of my origin
     * @param y - the y grid coordinate of my origin
     * @param width - the width I'm allowed to draw within
     * @param height - the height I'm allowed to draw within
     */
    export function roundRect(gc: CachedCanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: boolean, stroke?: number | boolean) {

        if (!stroke) {
            stroke = true;
        }
        if (!radius) {
            radius = 5;
        }
        gc.beginPath();
        gc.moveTo(x + radius, y);
        gc.lineTo(x + width - radius, y);
        gc.quadraticCurveTo(x + width, y, x + width, y + radius);
        gc.lineTo(x + width, y + height - radius);
        gc.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        gc.lineTo(x + radius, y + height);
        gc.quadraticCurveTo(x, y + height, x, y + height - radius);
        gc.lineTo(x, y + radius);
        gc.quadraticCurveTo(x, y, x + radius, y);
        gc.closePath();
        if (stroke) {
            gc.stroke();
        }
        if (fill) {
            gc.fill();
        }
        gc.closePath();
    }
}
