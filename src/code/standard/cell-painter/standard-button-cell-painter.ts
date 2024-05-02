
import { RevCellPainter, RevSchemaField, RevViewCell } from '../../client/internal-api';
import { RevRectangle } from '../../common/internal-api';
import { RevStandardBehavioredColumnSettings, RevStandardBehavioredGridSettings } from '../settings/internal-api';
import { RevStandardCellPainter } from './standard-cell-painter';

/**
 * The default cell rendering function for a button cell.
 * @public
 */
export class RevStandardButtonCellPainter<
    BGS extends RevStandardBehavioredGridSettings,
    BCS extends RevStandardBehavioredColumnSettings,
    SF extends RevSchemaField
> extends RevStandardCellPainter<BGS, BCS, SF> {
    config: RevStandardButtonCellPainter.Config;

    override paint(cell: RevViewCell<BCS, SF>, _prefillColor: string | undefined): number | undefined {
        const gc = this._renderingContext;
        const config = this.config;

        const val = config.value;
        const bounds = config.bounds;
        const x = bounds.x + 1;
        const y = bounds.y + 1;
        const width = bounds.width - 2;
        const height = bounds.height - 2;
        const radius = height / 2;
        const arcGradient = gc.createLinearGradient(x, y, x, y + height);

        // if (config.mouseDown) {
        //     arcGradient.addColorStop(0, '#B5CBED');
        //     arcGradient.addColorStop(1, '#4d74ea');
        // } else {
        //     arcGradient.addColorStop(0, '#ffffff');
        //     arcGradient.addColorStop(1, '#aaaaaa');
        // }

        // draw the background
        gc.cache.fillStyle = config.backgroundColor;
        gc.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

        // draw the capsule
        gc.cache.fillStyle = arcGradient;
        gc.cache.strokeStyle = '#000000';
        RevCellPainter.roundRect(gc, x, y, width, height, radius, arcGradient !== undefined, true);

        const ox = (width - gc.getTextWidth(val)) / 2;
        const oy = (height - gc.getTextHeight(gc.cache.font).descent) / 2;

        // draw the text
        gc.cache.textBaseline = 'middle';
        gc.cache.fillStyle = '#333333';
        gc.cache.font = (height - 2).toString(10) + 'px sans-serif';
        gc.fillText(val, x + ox, y + oy);

        return undefined;
    }
}

/** @public */
export namespace RevStandardButtonCellPainter {
    export const typeName = 'Button';

    export interface Config {
        value: string;
        bounds: RevRectangle;
        backgroundColor: string;
    }
}
