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

/**
 * For each key in src:
 * * When `src[key]` is defined, assigns it to `object[key]` when the latter does not exist or is writable or is a setter
 * * When `src[key]` is undefined:
 *    * When `object[key]` is a configurable property and not an accessor, deletes it
 *    * Else when `object[key]` is writable or a setter, assigns `undefined` (setter handles deletion)
 * @param dest
 * @param src - Defined values set the corresponding key in `dest`. `undefined` values delete the key from `dest`.
 */
export function assignOrDelete(dest: Record<string, unknown>, src: Record<string, unknown>) {
    Object.keys(src).forEach(function(key) {
        let descriptor: PropertyDescriptor | undefined;
        for (let obj = dest; obj; obj = Object.getPrototypeOf(obj)) {
            descriptor = Object.getOwnPropertyDescriptor(obj, key);
            if (descriptor !== undefined) {
                break;
            }
        }

        if (src[key] !== undefined) {
            if (!descriptor || descriptor.writable || descriptor.set) {
                dest[key] = src[key];
            }
        } else {
            if (descriptor !== undefined) {
                if (descriptor.configurable && !descriptor.set && !descriptor.get) {
                    delete dest[key];
                } else if (descriptor.writable || descriptor.set) {
                    dest[key] = undefined;
                }
            } // else no descriptor so no property to delete
        }
    });
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
