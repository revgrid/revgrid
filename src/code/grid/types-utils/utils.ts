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
