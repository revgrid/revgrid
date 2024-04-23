
import { DatalessViewCell, SchemaField } from '../../grid/internal-api';
import { StandardBehavioredColumnSettings, StandardBehavioredGridSettings } from '../settings/internal-api';
import { StandardCellPainter } from './standard-cell-painter';

/** @public */
export class StandardTagCellPainter<
    BGS extends StandardBehavioredGridSettings,
    BCS extends StandardBehavioredColumnSettings,
    SF extends SchemaField
> extends StandardCellPainter<BGS, BCS, SF> {

    override paint(_cell: DatalessViewCell<BCS, SF>, _prefillColor: string | undefined): number | undefined {
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
export namespace StandardTagCellPainter {
    export const typeName = 'Tag';

    // Has not been implemented.  Needs to be declared elsewhere
    export interface Tagband {
        floor: number;
        fillStyle: string;
    }
}
