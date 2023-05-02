import { SubgridInterface } from './common/subgrid-interface';
import { AssertError, ColumnsManager } from './grid-public-api';
import { Point } from './lib/point';
import { DataModel } from './model/data-model';

/** @public */
export class Focus {
    readonly subgrid: SubgridInterface;

    private _current: Point | undefined;
    private _previous: Point | undefined;

    constructor(
        private readonly _mainSubgrid: SubgridInterface,
        private readonly _columnsManager: ColumnsManager,
        private readonly _scrollToMakeVisibleEventer: Focus.ScrollToMakeVisibleEventer,
    ) {
        this.subgrid = this._mainSubgrid;
    }

    get x() { return this._current === undefined ? undefined : this._current.x; }
    get y() { return this._current === undefined ? undefined : this._current.y; }

    get current() { return this._current; }
    get previous() { return this._previous; }

    clear() {
        this._previous = this.current;
        this._current = undefined;
    }

    set(newCurrent: Point) {
        if (this._current === undefined || this._current.x !== newCurrent.x || this._current.y !== newCurrent.y) {
            this._previous = this._current;
            this._current = newCurrent;
            this._scrollToMakeVisibleEventer(this._current.x, this._current.y, true);
        }
    }

    setXCoordinate(x: number) {
        if (this._current === undefined || this._current.x !== x) {
            this._previous = this._current;
            const y = this._current === undefined ? 0 : this._current.y;

            this._current = {
                x,
                y,
            };

            this._scrollToMakeVisibleEventer(this._current.x, this._current.y, true);
        }
    }

    setYCoordinate(y: number) {
        if (this._current === undefined || this._current.y !== y) {
            this._previous = this._current;
            const x = this._current === undefined ? 0 : this._current.x;
            this._current = {
                x,
                y,
            };
            this._scrollToMakeVisibleEventer(this._current.x, this._current.y, true);
        }
    }

    setXYCoordinates(x: number, y: number) {
        if (this._current === undefined || this._current.x !== x || this._current.y !== y) {
            this._previous = this._current;
            this._current = {
                x,
                y,
            };
            this._scrollToMakeVisibleEventer(this._current.x, this._current.y, true);
        }
    }

    isRowFocused(mainSubgridRowIndex: number) {
        return this._current !== undefined && mainSubgridRowIndex === this._current.y;
    }

    isSubgridRowFocused(subgridRowIndex: number, subgrid: SubgridInterface) {
        return subgrid === this._mainSubgrid && this._current !== undefined && subgridRowIndex === this._current.y;
    }

    adjustForRowsInserted(rowIndex: number, rowCount: number, dataModel: DataModel) {
        if (dataModel === this._mainSubgrid.dataModel) {
            if (this._current !== undefined) {
                Point.adjustForYRangeInserted(this._current, rowIndex, rowCount);
            }
            if (this._previous !== undefined) {
                Point.adjustForYRangeInserted(this._previous, rowIndex, rowCount);
            }
        }
    }

    adjustForRowsDeleted(rowIndex: number, rowCount: number, dataModel: DataModel) {
        if (dataModel === this._mainSubgrid.dataModel) {
            if (this._current !== undefined) {
                const positionInDeletionRange = Point.adjustForYRangeDeleted(this._current, rowIndex, rowCount);
                if (positionInDeletionRange !== undefined) {
                    this._current = undefined;
                }
            }
            if (this._previous !== undefined) {
                const positionInDeletionRange = Point.adjustForYRangeDeleted(this._previous, rowIndex, rowCount);
                if (positionInDeletionRange !== undefined) {
                    this._previous = undefined;
                }
            }
        }
    }

    adjustForRowsMoved(oldRowIndex: number, newRowIndex: number, count: number, dataModel: DataModel) {
        if (dataModel === this._mainSubgrid.dataModel) {
            if (this._current !== undefined) {
                Point.adjustForYRangeMoved(this._current, oldRowIndex, newRowIndex, count);
            }
            if (this._previous !== undefined) {
                Point.adjustForYRangeMoved(this._previous, oldRowIndex, newRowIndex, count);
            }
        }
    }

    adjustForColumnsInserted(columnIndex: number, columnCount: number) {
        if (this._current !== undefined) {
            Point.adjustForXRangeInserted(this._current, columnIndex, columnCount);
        }
        if (this._previous !== undefined) {
            Point.adjustForXRangeInserted(this._previous, columnIndex, columnCount);
        }
    }

    adjustForColumnsDeleted(columnIndex: number, columnCount: number) {
        if (this._current !== undefined) {
            const positionInDeletionRange = Point.adjustForXRangeDeleted(this._current, columnIndex, columnCount);
            if (positionInDeletionRange !== undefined) {
                this._current = undefined;
            }
        }
        if (this._previous !== undefined) {
            const positionInDeletionRange = Point.adjustForXRangeDeleted(this._previous, columnIndex, columnCount);
            if (positionInDeletionRange !== undefined) {
                this._previous = undefined;
            }
        }
    }

    adjustForColumnsMoved(oldColumnIndex: number, newColumnIndex: number, count: number) {
        if (this._current !== undefined) {
            Point.adjustForXRangeMoved(this._current, oldColumnIndex, newColumnIndex, count);
        }
        if (this._previous !== undefined) {
            Point.adjustForXRangeMoved(this._previous, oldColumnIndex, newColumnIndex, count);
        }
    }

    createStash(): Focus.Stash {
        let currentStashPoint: Focus.Stash.Point | undefined;
        if (this._current !== undefined) {
            currentStashPoint = this.createStashPoint(this._current);
        }
        let previousStashPoint: Focus.Stash.Point | undefined;
        if (this._previous !== undefined) {
            previousStashPoint = this.createStashPoint(this._previous);
        }

        return {
            current: currentStashPoint,
            previous: previousStashPoint,
        }
    }

    restoreStash(stash: Focus.Stash) {
        this.clear();

        if (stash.current !== undefined) {
            this._current = this.createPointFromStash(stash.current);
        }
        if (stash.previous !== undefined) {
            this._previous = this.createPointFromStash(stash.previous);
        }
    }

    private createStashPoint(point: Point): Focus.Stash.Point | undefined {
        const dataModel = this._mainSubgrid.dataModel;
        if (dataModel.getRowIdFromIndex === undefined) {
            return undefined;
        } else {
            return {
                columnName: this._columnsManager.getActiveColumn(point.x).name,
                rowId: dataModel.getRowIdFromIndex(point.y),
            };
        }
    }

    private createPointFromStash(stashPoint: Focus.Stash.Point): Point | undefined {
        const { columnName, rowId: stashedRowId } = stashPoint;
        const activeColumnIndex = this._columnsManager.getActiveColumnIndexByName(columnName);
        if (activeColumnIndex < 0) {
            return undefined;
        } else {
            const dataModel = this._mainSubgrid.dataModel;
            if (dataModel.getRowIndexFromId !== undefined) {
                const rowIndex = dataModel.getRowIndexFromId(stashedRowId);
                if (rowIndex === undefined) {
                    throw new AssertError('FCPFSI50884'); // reindex should not lose row
                } else {
                    return {
                        x: activeColumnIndex,
                        y: rowIndex,
                    };
                }
            } else {
                if (dataModel.getRowIdFromIndex !== undefined) {
                    const rowCount = this._mainSubgrid.getRowCount();
                    for (let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
                        const rowId = dataModel.getRowIdFromIndex(rowIndex);
                        if (rowId === stashedRowId) {
                            return {
                                x: activeColumnIndex,
                                y: rowIndex,
                            };
                        }
                    }
                    throw new AssertError('FCPFSL50884'); // reindex should not lose row
                } else {
                    return undefined;
                }
            }
        }
    }
}

/** @public */
export namespace Focus {
    export type ScrollToMakeVisibleEventer = (this: void, activeColumnIndex: number, subgridRowIndex: number, maximally: boolean) => void;

    export interface Stash {
        readonly current: Stash.Point | undefined;
        readonly previous: Stash.Point | undefined;
    }

    export namespace Stash {
        export interface Point {
            readonly columnName: string;
            readonly rowId: unknown;
        }
    }
}
