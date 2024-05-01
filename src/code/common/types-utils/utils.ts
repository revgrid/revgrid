// (c) 2024 Xilytix Pty Ltd / Paul Klink

/**
 * Will return null if conversion not possible
 * @public
 */
export function revSafeConvertUnknownToBoolean(value: unknown) {
    switch (typeof value) {
        case 'string': {
            if (value === '') {
                return undefined;
            } else {
                const trimmedLowerCaseBoolStr = value.trim().toLowerCase();
                if (
                    trimmedLowerCaseBoolStr === 'true' ||
                    trimmedLowerCaseBoolStr === '1' ||
                    trimmedLowerCaseBoolStr === 'yes'
                ) {
                    return true;
                } else {
                    if (
                        trimmedLowerCaseBoolStr === 'false' ||
                        trimmedLowerCaseBoolStr === '0' ||
                        trimmedLowerCaseBoolStr === 'no'
                    ) {
                        return false;
                    } else {
                        return null;
                    }
                }
            }
        }
        case 'number':
        case 'bigint':
            if (value === 0) {
                return false;
            } else {
                if (value === 1) {
                    return true;
                } else {
                    return null;
                }
            }
        case 'boolean':
            return value;
        case 'symbol':
            return null;
        case 'undefined':
            return undefined;
        case 'object':
            return value === null ? undefined : null;
        case 'function':
            return null;
        default:
            // typeof value satisfies never
            return null;
    }
}

/** @internal */
export function revCalculateNumberArrayUniqueCount<T extends number>(array: T[]) {
    array.sort((left, right) => left - right);
    const allCount = array.length;
    let previousIndex = array[0];
    let uniqueCount = 1;
    for (let i = 1; i < allCount; i++) {
        const index = array[i];
        if (index !== previousIndex) {
            uniqueCount++;
            previousIndex = index;
        }
    }
    return uniqueCount;
}

/** @internal */
export interface RevSplitStringAtFirstNonNumericCharResult {
    numericPart: string;
    firstNonNumericCharPart: string;
}

/** @internal */
export function revSplitStringAtFirstNonNumericChar(value: string): RevSplitStringAtFirstNonNumericCharResult {
    value = value.trimStart();

    const length = value.length;
    if (length === 0) {
        return { numericPart: '', firstNonNumericCharPart: '' }
    } else {
        let firstNonDigitPartIndex = length;
        let gotDecimalPoint = false;
        for (let i = 0; i < length; i++) {
            const char = value[i];
            if (!revIsDigit(char)) {
                if (char !== '.') {
                    firstNonDigitPartIndex = i;
                    break;
                } else {
                    if (gotDecimalPoint) {
                        firstNonDigitPartIndex = i;
                        break;
                    } else {
                        gotDecimalPoint = true;
                    }
                }
            }
        }
        const digitsPart = value.substring(0, firstNonDigitPartIndex);
        const firstNonDigitPart = value.substring(firstNonDigitPartIndex).trim();

        return { numericPart: digitsPart, firstNonNumericCharPart: firstNonDigitPart };
    }
}

/** @internal */
export function revIsDigit(char: string) {
    return char >= '0' && char <= '9';
}

/** @internal */
export function revCalculateAdjustmentForRangeMoved(value: number, oldRangeIndex: number, newRangeIndex: number, rangeCount: number) {
    if (newRangeIndex > oldRangeIndex) {
        if (oldRangeIndex + rangeCount <= value) {
            if (newRangeIndex + rangeCount > value) {
                return -rangeCount; // move range up over value
            }
        } else {
            if (value >= oldRangeIndex) {
                return newRangeIndex - oldRangeIndex; // movement up includes value
            }
        }
    } else {
        if (newRangeIndex < oldRangeIndex) {
            if (oldRangeIndex > value) {
                if (newRangeIndex < value) {
                    return rangeCount; // move range down over value
                }
            } else {
                if (value < (oldRangeIndex + rangeCount)) {
                    return newRangeIndex - oldRangeIndex; // movement down includes value
                }
            }
        }
    }

    return 0; // not affected
}
