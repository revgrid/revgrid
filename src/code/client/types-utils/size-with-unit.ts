import { RevSizeUnit, RevSizeUnitEnum } from './size-unit';
import { revSplitStringAtFirstNonNumericChar } from './utils';

/** @public */
export interface RevSizeWithUnit {
    size: number;
    sizeUnit: RevSizeUnitEnum;
}

/** @public */
export namespace RevSizeWithUnit {
    export function tryParse(value: string): RevSizeWithUnit | undefined {
        const { numericPart: digitsPart, firstNonNumericCharPart: firstNonDigitPart } = revSplitStringAtFirstNonNumericChar(value);
        const size = Number.parseFloat(digitsPart);
        if (isNaN(size)) {
            return undefined;
        } else {
            const sizeUnit = RevSizeUnit.tryParse(firstNonDigitPart);
            if (sizeUnit === undefined) {
                return undefined;
            } else {
                return { size, sizeUnit };
            }
        }
    }

    /** @internal */
    export function formatSize(size: number, sizeUnit: RevSizeUnitEnum) {
        return size.toString(10) + RevSizeUnit.format(sizeUnit);
    }
}
