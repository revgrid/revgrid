
import { CanvasRenderingContext2DEx, CellPainter, RectangleInterface } from '../grid/grid-public-api';

/**
 * Renders a sparkline.
 * {@link http://www.edwardtufte.com/bboard/q-and-a-fetch-msg?msg_id=0001OR|Edward Tufte sparkline}
 * @public
 */
export class SparkLineCellPainter implements CellPainter {
    config: SparkLineCellPainter.Config;

    paint(gc: CanvasRenderingContext2DEx): CellPainter.PaintInfo {
        const config = this.config;

        let x = config.bounds.x;
        const y = config.bounds.y;
        const width = config.bounds.width;
        const height = config.bounds.height;

        gc.beginPath();
        const val = config.value as number[];
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

            return {
                width: count * 10,
                snapshot: undefined,
            };
        }
    }
}

/** @public */
export namespace SparkLineCellPainter {
    export const typeName = 'SparkLine';

    export interface Config {
        value: number[];
        bounds: RectangleInterface;
        backgroundColor: string;
        isSelected: boolean;
        backgroundSelectionColor: string;
        foregroundSelectionColor: string;
        color: string;
    }
}