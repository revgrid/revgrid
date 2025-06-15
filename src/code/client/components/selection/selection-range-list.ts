import { RevContiguousIndexRangeList } from './contiguous-index-range-list';
import { RevSelectionAreaList } from './selection-area-list';

export class RevSelectionRangeList extends RevContiguousIndexRangeList implements RevSelectionAreaList {
    get areaCount() { return this.ranges.length; }
}
