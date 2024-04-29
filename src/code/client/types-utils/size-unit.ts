import { RevUnreachableCaseError } from './revgrid-error';

/** @public */
export const enum RevSizeUnitId {
    Pixel,
    Percent,
    Fractional,
    Em,
}

/** @public */
export const enum RevSizeUnitCode {
    Pixel = 'px',
    Percent = '%',
    Fractional = 'fr',
    Em = 'em',
}

/** @public */
export namespace RevSizeUnit {
    export function tryParse(value: string) {
        switch (value as RevSizeUnitCode) {
            case RevSizeUnitCode.Pixel: return RevSizeUnitId.Pixel;
            case RevSizeUnitCode.Percent: return RevSizeUnitId.Percent;
            case RevSizeUnitCode.Fractional: return RevSizeUnitId.Fractional;
            case RevSizeUnitCode.Em: return RevSizeUnitId.Em;
            default: return undefined;
        }
    }

    export function format(value: RevSizeUnitId) {
        switch (value) {
            case RevSizeUnitId.Pixel: return RevSizeUnitCode.Pixel;
            case RevSizeUnitId.Percent: return RevSizeUnitCode.Percent;
            case RevSizeUnitId.Fractional: return RevSizeUnitCode.Fractional;
            case RevSizeUnitId.Em: return RevSizeUnitCode.Em;
            default:
                throw new RevUnreachableCaseError('SUEF44998', value);
        }
    }
}
