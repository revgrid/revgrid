
import { RevSchemaField, RevViewCell } from '../../client/internal-api';
import { RevStandardBehavioredColumnSettings, RevStandardBehavioredGridSettings } from '../settings/internal-api';
import { RevStandardCellPainter } from './standard-cell-painter';

/** @public */
export class RevStandardTagCellPainter<
    BGS extends RevStandardBehavioredGridSettings,
    BCS extends RevStandardBehavioredColumnSettings,
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

/** @public */
export namespace RevStandardTagCellPainter {
    export const typeName = 'Tag';

    // Has not been implemented.  Needs to be declared elsewhere
    export interface Tagband {
        floor: number;
        fillStyle: string;
    }
}
