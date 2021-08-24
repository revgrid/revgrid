/** @internal */
export function numberToPixels(value: number) {
    return value.toString() + 'px';
}

/** @internal */
export function deepClone(object: Record<string, unknown>) {
    const result = clone(object);
    Object.keys(result).forEach(function(key) {
        const descriptor = Object.getOwnPropertyDescriptor(result, key);
        if (typeof descriptor.value === 'object') {
            result[key] = deepClone(descriptor.value);
        }
    });
    return result;
}

/** @internal */
function clone(value: unknown) {
    if (Array.isArray(value)) {
        return value.slice(); // clone array
    } else if (typeof value === 'object') {
        return Object.defineProperties({}, Object.getOwnPropertyDescriptors(value));
    } else {
        return value;
    }
}
