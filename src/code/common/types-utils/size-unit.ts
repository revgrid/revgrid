// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevUnreachableCaseError } from './revgrid-error';

/** @public */
export const enum RevSizeUnitId {
    Pixel,
    Percent,
    Fractional,
    Em,
}

/** @public */
export type RevSizeUnit =
    typeof RevSizeUnit.pixel |
    typeof RevSizeUnit.percent |
    typeof RevSizeUnit.fractional |
    typeof RevSizeUnit.em;

/** @public */
export namespace RevSizeUnit {
    export const pixel = 'px';
    export const percent = '%';
    export const fractional = 'fr';
    export const em = 'em';

    export function tryParse(value: string): RevSizeUnitId | undefined {
        switch (value) {
            case pixel: return RevSizeUnitId.Pixel;
            case percent: return RevSizeUnitId.Percent;
            case fractional: return RevSizeUnitId.Fractional;
            case em: return RevSizeUnitId.Em;
            default: return undefined;
        }
    }

    export function format(value: RevSizeUnitId): RevSizeUnit {
        switch (value) {
            case RevSizeUnitId.Pixel: return pixel;
            case RevSizeUnitId.Percent: return percent;
            case RevSizeUnitId.Fractional: return fractional;
            case RevSizeUnitId.Em: return em;
            default:
                throw new RevUnreachableCaseError('SUEF44998', value);
        }
    }
}
