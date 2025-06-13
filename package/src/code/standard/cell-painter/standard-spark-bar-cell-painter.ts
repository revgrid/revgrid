
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevViewCell } from '../../client/internal-api';
import { RevRectangle, RevSchemaField } from '../../common/internal-api';
import { RevStandardCellPainter } from './standard-cell-painter';

/**
 * Renders a bar chart sparkline, hence the name.
 * @public
 */
export class RevStandardSparkBarCellPainter<
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings,
    SF extends RevSchemaField
> extends RevStandardCellPainter<BGS, BCS, SF> {
    config: RevStandardSparkBarCellPainter.Config;

    override paint(_cell: RevViewCell<BCS, SF>, _prefillColor: string | undefined): number | undefined {
        const gc = this._renderingContext;
        const config = this.config;

        let x = config.bounds.x;
        const y = config.bounds.y;
        const width = config.bounds.width;
        const height = config.bounds.height;

        gc.beginPath();
        const val = config.value;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (val === undefined || val.length === 0) {
            return undefined;
        } else {
            const count = val.length;
            const eWidth = width / count;
            const fgColor = config.isSelected ? config.foregroundSelectionColor : config.color;
            if (config.backgroundColor || config.isSelected) {
                gc.cache.fillStyle = config.isSelected ? 'blue' : config.backgroundColor;
                gc.fillRect(x, y, width, height);
            }
            gc.cache.fillStyle = fgColor;
            for (let i = 0; i < val.length; i++) {
                const barheight = val[i] / 110 * height;
                gc.fillRect(x + 5, y + height - barheight, eWidth * 0.6666, barheight);
                x += eWidth;
            }
            gc.closePath();
            return count * 10;
        }
    }
}

/** @public */
export namespace RevStandardSparkBarCellPainter {
    export const typeName = 'SparkBar';

    export interface Config {
        value: number[];
        bounds: RevRectangle;
        backgroundColor: string;
        isSelected: boolean;
        foregroundSelectionColor: string;
        color: string;
    }
}
