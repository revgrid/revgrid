
import { CanvasRenderingContext2DEx, CellPainter } from '../grid/grid-public-api';

/** @public */
export class TagCellPainter implements CellPainter {

    paint(_gc: CanvasRenderingContext2DEx): CellPainter.PaintInfo {
        // const tagbands: TagCellPainter.Tagband[] | undefined = undefined; // should be config.tagbands
        // if (tagbands) {
        //     const tagband = tagbands.find((tagband) => {
        //         return config.value >= tagband.floor;
        //     });
        //     const fillStyle = tagband && tagband.fillStyle;

        //     if (fillStyle) {
        //         const b = config.bounds,
        //             x = b.x + b.width - 1,
        //             y = b.y;

        //         gc.beginPath();
        //         gc.moveTo(x, y);
        //         gc.lineTo(x, y + 8);
        //         gc.lineTo(x - 8, y);
        //         // gc.lineTo(x, y);
        //         gc.closePath();
        //         gc.cache.fillStyle = fillStyle;
        //         gc.fill();
        //     }
        // }
        return {
            width: undefined,
            snapshot: undefined,
        };
    }
}

/** @public */
export namespace TagCellPainter {
    export const typeName = 'Tag';

    // Has not been implemented.  Needs to be declared elsewhere
    export interface Tagband {
        floor: number;
        fillStyle: string;
    }
}
