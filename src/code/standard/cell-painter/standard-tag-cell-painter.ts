
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevViewCell } from '../../client/internal-api';
import { RevSchemaField } from '../../common/internal-api';
import { RevStandardCellPainter } from './standard-cell-painter';

/**
 * Potential future
 * @internal
 */
export class RevStandardTagCellPainter<
    BGS extends RevBehavioredGridSettings,
    BCS extends RevBehavioredColumnSettings,
    SF extends RevSchemaField
> extends RevStandardCellPainter<BGS, BCS, SF> {

    override paint(_cell: RevViewCell<BCS, SF>, _prefillColor: string | undefined): number | undefined {
        // const gc = this._renderingContext;
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
        return undefined;
    }
}

/** @internal */
export namespace RevStandardTagCellPainter {
    export const typeName = 'Tag';

    // Has not been implemented.  Needs to be declared elsewhere
    export interface Tagband {
        floor: number;
        fillStyle: string;
    }
}
