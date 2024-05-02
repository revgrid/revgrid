import { RevCachedCanvasRenderingContext2D, RevSchemaField } from '../../../common/internal-api';
import { RevBehavioredColumnSettings } from '../../settings/internal-api';
import { RevDatalessViewCell } from '../dataless/dataless-view-cell';
import { RevCellPossiblyPaintable } from './cell-possibly-paintable';

/**
 * Implementations of `RevCellPainter` are used to render the 2D graphics context within the bound of a cell.
 *
 * Implement this interface to implement your own cell painter.
 *
 * @public
 */
export interface RevCellPainter<BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> extends RevCellPossiblyPaintable<BCS, SF> {

    /**
     * An empty implementation of a cell renderer, see [the null object pattern](http://c2.com/cgi/wiki?NullObject).
     * @returns Preferred pixel width of content. The content may or may not be rendered at that width depending on whether or not `config.bounds` was respected and whether or not the grid renderer is using clipping. (Clipping is generally not used due to poor performance.)
     */
    paint(cell: RevDatalessViewCell<BCS, SF>, prefillColor: string | undefined): number | undefined;

}

/** @public */
export namespace RevCellPainter {
    /**
     * A simple implementation of rounding a cell.
     * @param x - the x grid coordinate of my origin
     * @param y - the y grid coordinate of my origin
     * @param width - the width I'm allowed to draw within
     * @param height - the height I'm allowed to draw within
     */
    export function roundRect(gc: RevCachedCanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number, fill: boolean, stroke?: number | boolean) {

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
