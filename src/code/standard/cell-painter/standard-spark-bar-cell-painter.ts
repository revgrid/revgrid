
import { DatalessViewCell, Rectangle, SchemaField } from '../../grid/grid-public-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/standard-settings-public-api';
import { StandardCellPainter } from './standard-cell-painter';

/**
 * Renders a bar chart sparkline, hence the name.
 * @public
 */
export class StandardSparkBarCellPainter<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SF extends SchemaField
> extends StandardCellPainter<BGS, BCS, SF> {
    config: StandardSparkBarCellPainter.Config;

    override paint(_cell: DatalessViewCell<BCS, SF>, _prefillColor: string | undefined): number | undefined {
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
export namespace StandardSparkBarCellPainter {
    export const typeName = 'SparkBar';

    export interface Config {
        value: number[];
        bounds: Rectangle;
        backgroundColor: string;
        isSelected: boolean;
        foregroundSelectionColor: string;
        color: string;
    }
}
