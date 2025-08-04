import { RevContiguousIndexRangeList } from './contiguous-index-range-list';

export class RevSelectionRangeList extends RevContiguousIndexRangeList {
    get areaCount() { return this.ranges.length; }
}
