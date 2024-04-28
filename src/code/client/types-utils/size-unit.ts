import { RevUnreachableCaseError } from './revgrid-error';

/** @public */
export const enum RevSizeUnitEnum {
    Pixel = 'px',
    Percent = '%',
    Fractional = 'fr',
    Em = 'em',
}

/** @public */
export type RevSizeUnit = typeof RevSizeUnitEnum;

/** @public */
export namespace RevSizeUnit {
    export function tryParse(value: string) {
        switch (value as RevSizeUnitEnum) {
            case RevSizeUnitEnum.Pixel: return RevSizeUnitEnum.Pixel;
            case RevSizeUnitEnum.Percent: return RevSizeUnitEnum.Percent;
            case RevSizeUnitEnum.Fractional: return RevSizeUnitEnum.Fractional;
            case RevSizeUnitEnum.Em: return RevSizeUnitEnum.Em;
            default: return undefined;
        }
    }

    export function format(value: RevSizeUnitEnum) {
        switch (value) {
            case RevSizeUnitEnum.Pixel: return RevSizeUnitEnum.Pixel;
            case RevSizeUnitEnum.Percent: return RevSizeUnitEnum.Percent;
            case RevSizeUnitEnum.Fractional: return RevSizeUnitEnum.Fractional;
            case RevSizeUnitEnum.Em: return RevSizeUnitEnum.Em;
            default:
                throw new RevUnreachableCaseError('SUEF44998', value);
        }
    }
}
