export class RevContiguousIndexRange {
    private _after: number;

    constructor(private _start: number, private _length: number) {
        this._after = this._start + this._length;
    }

    get start() { return this._start; }
    get length() { return this._length; }
    get after() { return this._after; }

    setStart(value: number) {
        this._start = value;
        this._length = this._after - this._start;
    }

    setAfter(value: number) {
        this._after = value;
        this._length = this._after - this._start;
    }

    move(offset: number) {
        this._start += offset;
        this._after += offset;
    }

    grow(increment: number) {
        this._length += increment;
        this._after += increment;
    }

    createCopy() {
        return new RevContiguousIndexRange(this._start, this._length);
    }

    includes(index: number) {
        return index >= this._start && index < this._after;
    }

    overlaps(other: RevContiguousIndexRange): boolean {
        return (this._start >= other._start) && (this._start < other._after) ||
            (this._after >= other._start) && (this._after < other._after);
    }

    abuts(other: RevContiguousIndexRange): boolean {
        return this._after === other._start || this._start === other._after;
    }

    contains(this: RevContiguousIndexRange, other: RevContiguousIndexRange) {
        return other._start >= this._start && other._after <= this._after;
    }

    createFromAbuttingOverlapping(this: RevContiguousIndexRange, other: RevContiguousIndexRange) {
        const thisIndex = this._start;
        const otherIndex = other._start;
        const mergedIndex = thisIndex < otherIndex ? thisIndex : otherIndex;
        const thisAfter = this._after;
        const otherAfter = other._after;
        const mergedAfter = thisAfter > otherAfter ? thisAfter : otherAfter;
        return new RevContiguousIndexRange(mergedIndex, mergedAfter - mergedIndex);
    }

    addIndicesToArray(array: number[], count: number) {
        const after = this._after;
        for (let i = this._start; i < after; i++) {
            array[count++] = i;
        }
        return count;
    }
}
