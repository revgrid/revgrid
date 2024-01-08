import { UnreachableCaseError } from './revgrid-error';

/** @public */
export const enum SizeUnitEnum {
    Pixel = 'px',
    Percent = '%',
    Fractional = 'fr',
    Em = 'em',
}

/** @public */
export type SizeUnit = typeof SizeUnitEnum;

/** @public */
export namespace SizeUnit {
    export function tryParse(value: string) {
        switch (value) {
            case SizeUnitEnum.Pixel: return SizeUnitEnum.Pixel;
            case SizeUnitEnum.Percent: return SizeUnitEnum.Percent;
            case SizeUnitEnum.Fractional: return SizeUnitEnum.Fractional;
            case SizeUnitEnum.Em: return SizeUnitEnum.Em;
            default: return undefined;
        }
    }

    export function format(value: SizeUnitEnum) {
        switch (value) {
            case SizeUnitEnum.Pixel: return SizeUnitEnum.Pixel;
            case SizeUnitEnum.Percent: return SizeUnitEnum.Percent;
            case SizeUnitEnum.Fractional: return SizeUnitEnum.Fractional;
            case SizeUnitEnum.Em: return SizeUnitEnum.Em;
            default:
                throw new UnreachableCaseError('SUEF44998', value);
        }
    }
}
