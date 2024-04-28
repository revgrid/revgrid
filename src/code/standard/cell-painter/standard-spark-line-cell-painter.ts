
import { RevDatalessViewCell, RevRectangle, RevSchemaField } from '../../client/internal-api';
import { RevStandardBehavioredColumnSettings, RevStandardBehavioredGridSettings } from '../settings/internal-api';
import { RevStandardCellPainter } from './standard-cell-painter';

/**
 * Renders a sparkline.
 * {@link http://www.edwardtufte.com/bboard/q-and-a-fetch-msg?msg_id=0001OR|Edward Tufte sparkline}
 * @public
 */
export class RevStandardSparkLineCellPainter<
    BGS extends RevStandardBehavioredGridSettings,
    BCS extends RevStandardBehavioredColumnSettings,
    SF extends RevSchemaField
> extends RevStandardCellPainter<BGS, BCS, SF> {
    config: RevStandardSparkLineCellPainter.Config;

    override paint(_cell: RevDatalessViewCell<BCS, SF>, _prefillColor: string | undefined): number | undefined {
        const gc = this._renderingContext;
        const config = this.config;

        let x = config.bounds.x;
        const y = config.bounds.y;
        const width = config.bounds.width;
        const height = config.bounds.height;

        gc.beginPath();
        const val = config.value;
        if (val === undefined || val.length === 0) {
            return undefined;
        } else {
            const count = val.length;
            const eWidth = width / count;

            const fgColor = config.isSelected ? config.foregroundSelectionColor : config.color;
            if (config.backgroundColor || config.isSelected) {
                gc.cache.fillStyle = config.isSelected ? config.backgroundSelectionColor : config.backgroundColor;
                gc.fillRect(x, y, width, height);
            }
            gc.cache.strokeStyle = fgColor;
            gc.cache.fillStyle = fgColor;
            gc.beginPath();
            let prev: number | undefined;
            for (let i = 0; i < val.length; i++) {
                const barheight = val[i] / 110 * height;
                if (prev === undefined) {
                    prev = barheight;
                }
                gc.lineTo(x + 5, y + height - barheight);
                gc.arc(x + 5, y + height - barheight, 1, 0, 2 * Math.PI, false);
                x += eWidth;
            }
            gc.stroke();
            gc.closePath();

            return count * 10;
        }
    }
}

/** @public */
export namespace RevStandardSparkLineCellPainter {
    export const typeName = 'SparkLine';

    export interface Config {
        value: number[];
        bounds: RevRectangle;
        backgroundColor: string;
        isSelected: boolean;
        backgroundSelectionColor: string;
        foregroundSelectionColor: string;
        color: string;
    }
}
