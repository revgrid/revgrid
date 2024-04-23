import { SizeUnit, SizeUnitEnum } from './size-unit';
import { splitStringAtFirstNonNumericChar } from './utils';

/** @public */
export interface SizeWithUnit {
    size: number;
    sizeUnit: SizeUnitEnum;
}

/** @public */
export namespace SizeWithUnit {
    export function tryParse(value: string): SizeWithUnit | undefined {
        const { numericPart: digitsPart, firstNonNumericCharPart: firstNonDigitPart } = splitStringAtFirstNonNumericChar(value);
        const size = Number.parseFloat(digitsPart);
        if (isNaN(size)) {
            return undefined;
        } else {
            const sizeUnit = SizeUnit.tryParse(firstNonDigitPart);
            if (sizeUnit === undefined) {
                return undefined;
            } else {
                return { size, sizeUnit };
            }
        }
    }

    /** @internal */
    export function formatSize(size: number, sizeUnit: SizeUnitEnum) {
        return size.toString(10) + SizeUnit.format(sizeUnit);
    }
}
