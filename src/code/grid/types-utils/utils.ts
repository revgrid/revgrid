/**
 * Will return null if conversion not possible
 * @public
 */
export function safeConvertUnknownToBoolean(value: unknown) {
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
export function numberToPixels(value: number) {
    return value.toString() + 'px';
}

/** @internal */
export function deepExtendObject(target: Record<string, unknown>, obj: Record<string, unknown> | undefined): Record<string, unknown> {
    if (obj !== undefined) {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key];
                const existingTarget = target[key];
                target[key] = deepExtendValue(existingTarget, value);
            }
        }
    }

    return target;
}

/** @internal */
export function deepExtendValue(existingTarget: unknown, value: unknown): unknown {
    if (typeof value !== 'object') {
        return value;
    } else {
        if (value instanceof Array) {
            const length = value.length;
            const targetArray = new Array<unknown>(length);
            for (let i = 0; i < length; i++) {
                const element = value[i] as unknown;
                targetArray[i] = deepExtendValue({}, element);
            }
            return targetArray;
        } else {
            if (value === null) {
                return null;
            } else {
                const valueObj = value as Record<string, unknown>;
                if (existingTarget === undefined) {
                    return deepExtendObject({}, valueObj); // overwrite
                } else {
                    if (typeof existingTarget !== 'object') {
                        return deepExtendObject({}, valueObj); // overwrite
                    } else {
                        if (existingTarget instanceof Array) {
                            return deepExtendObject({}, valueObj); // overwrite
                        } else {
                            if (existingTarget === null) {
                                return deepExtendObject({}, valueObj); // overwrite
                            } else {
                                const existingTargetObj = existingTarget as Record<string, unknown>;
                                return deepExtendObject(existingTargetObj, valueObj); // merge
                            }
                        }
                    }
                }
            }
        }
    }
}


/** @internal */
export function deepClone(object: Record<string, unknown>) {
    return deepExtendValue({}, object);
}

/** @internal */
export function calculateNumberArrayUniqueCount<T extends number>(array: T[]) {
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
export function getErrorMessage(e: unknown): string {
    if (e instanceof Error) {
        return e.message;
    } else {
        if (typeof e === 'string') {
            return e;
        } else {
            return 'Unknown Error';
        }
    }
}

/** @internal */
export interface SplitStringAtFirstNonNumericCharResult {
    numericPart: string;
    firstNonNumericCharPart: string;
}

/** @internal */
export function splitStringAtFirstNonNumericChar(value: string): SplitStringAtFirstNonNumericCharResult {
    value = value.trimStart();

    const length = value.length;
    if (length === 0) {
        return { numericPart: '', firstNonNumericCharPart: '' }
    } else {
        let firstNonDigitPartIndex = length;
        let gotDecimalPoint = false;
        for (let i = 0; i < length; i++) {
            const char = value[i];
            if (!isDigit(char)) {
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
export function isDigit(char: string) {
    return char >= '0' && char <= '9';
}

/** @internal */
export function calculateAdjustmentForRangeMoved(value: number, oldRangeIndex: number, newRangeIndex: number, rangeCount: number) {
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

/** @internal */
export function isArrayEqual<T>(left: readonly T[], right: readonly T[]): boolean {
    const length = left.length;
    if (right.length !== length) {
        return false;
    } else {
        for (let i = 0; i < length; i++) {
            if (left[i] !== right[i]) {
                return false;
            }
        }
        return true;
    }
}

/** @internal */
export function moveElementInArray<T>(array: T[], fromIndex: number, toIndex: number) {
    const item = array[fromIndex];
    if (toIndex > fromIndex) {
        for (let i = fromIndex; i < toIndex; i++) {
            array[i] = array[i + 1];
        }
        array[toIndex] = item;
    } else {
        if (toIndex < fromIndex) {
            for (let i = fromIndex; i > toIndex; i--) {
                array[i] = array[i - 1];
            }
            array[toIndex] = item;
        }
    }
}

/** @internal */
export function moveElementsInArray<T>(array: T[], fromIndex: number, toIndex: number, count: number) {
    const temp = array.slice(fromIndex, fromIndex + count);
    if (fromIndex < toIndex) {
        for (let i = fromIndex; i < toIndex; i++) {
            array[i] = array[i + count];
        }
    } else {
        for (let i = fromIndex - 1; i >= toIndex; i--) {
            array[i + count] = array[i];
        }
    }

    for (let i = 0; i < count; i++) {
        array[toIndex + i] = temp[i];
    }
}
