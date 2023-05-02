
import { CanvasRenderingContext2DEx, CellPainter, RectangleInterface } from '../grid/grid-public-api';

/**
 * Renders a bar chart sparkline, hence the name.
 * @public
 */
export class SparkBarCellPainter implements CellPainter {
    config: SparkBarCellPainter.Config;

    paint(gc: CanvasRenderingContext2DEx): CellPainter.PaintInfo {
        const config = this.config;

        let x = config.bounds.x;
        const y = config.bounds.y;
        const width = config.bounds.width;
        const height = config.bounds.height;

        gc.beginPath();
        const val = config.value;
        if (!val || !val.length) {
            return {
                width: undefined,
                snapshot: undefined,
            };
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
            return {
                width: count * 10,
                snapshot: undefined,
            };
        }
    }
}

/** @public */
export namespace SparkBarCellPainter {
    export const typeName = 'SparkBar';

    export interface Config {
        value: number[];
        bounds: RectangleInterface;
        backgroundColor: string;
        isSelected: boolean;
        foregroundSelectionColor: string;
        color: string;
    }
}
