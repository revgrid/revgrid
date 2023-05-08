import { DataModel } from '../../interfaces/data-model';
import { SubgridInterface } from '../../interfaces/subgrid-interface';
import { PartialPoint, Point } from '../../lib/point';
import { AssertError } from '../../lib/revgrid-error';
import { ColumnsManager } from '../column/columns-manager';

/** @public */
export class Focus {
    readonly subgrid: SubgridInterface;

    private _currentSubgridPoint: Point | undefined;
    private _previousSubgridPoint: Point | undefined;

    // Optionally track position in canvas where focus is.  Used to assist with paging
    private _canvasX: number | undefined;
    private _canvasY: number | undefined;

    constructor(
        private readonly _mainSubgrid: SubgridInterface,
        private readonly _columnsManager: ColumnsManager,
        private readonly _scrollToMakeVisibleEventer: Focus.ScrollToMakeVisibleEventer,
    ) {
        this.subgrid = this._mainSubgrid;
    }

    get currentSubgridX() { return this._currentSubgridPoint === undefined ? undefined : this._currentSubgridPoint.x; }
    get currentSubgridY() { return this._currentSubgridPoint === undefined ? undefined : this._currentSubgridPoint.y; }

    get currentSubgridPoint() { return this._currentSubgridPoint; }
    get previousSubgridPoint() { return this._previousSubgridPoint; }


    get canvasX() { return this._canvasX; }
    get canvasY() { return this._canvasY; }

    clear() {
        this._previousSubgridPoint = this.currentSubgridPoint;
        this._currentSubgridPoint = undefined;
    }

    set(currentSubgridPoint: Point, canvasPoint?: PartialPoint | undefined) {
        if (this._currentSubgridPoint === undefined || this._currentSubgridPoint.x !== currentSubgridPoint.x || this._currentSubgridPoint.y !== currentSubgridPoint.y) {
            this._previousSubgridPoint = this._currentSubgridPoint;
            this._currentSubgridPoint = currentSubgridPoint;
            this._scrollToMakeVisibleEventer(this._currentSubgridPoint.x, this._currentSubgridPoint.y, true);
        }

        if (canvasPoint !== undefined) {
            const x = canvasPoint.x;
            if (x !== undefined) {
                this._canvasX = x;
            }

            const y = canvasPoint.y;
            if (y !== undefined) {
                this._canvasY = y;
            }
        }
    }

    setX(activeColumnIndex: number, canvasX?: number) {
        if (this._currentSubgridPoint === undefined || this._currentSubgridPoint.x !== activeColumnIndex) {
            this._previousSubgridPoint = this._currentSubgridPoint;
            const y = this._currentSubgridPoint === undefined ? 0 : this._currentSubgridPoint.y;

            this._currentSubgridPoint = {
                x: activeColumnIndex,
                y,
            };

            if (canvasX !== undefined) {
                this._canvasX = canvasX;
            }

            this._scrollToMakeVisibleEventer(this._currentSubgridPoint.x, this._currentSubgridPoint.y, true);
        }
    }

    setY(subgridRowIndex: number, canvasY?: number) {
        if (this._currentSubgridPoint === undefined || this._currentSubgridPoint.y !== subgridRowIndex) {
            this._previousSubgridPoint = this._currentSubgridPoint;
            const x = this._currentSubgridPoint === undefined ? 0 : this._currentSubgridPoint.x;
            this._currentSubgridPoint = {
                x,
                y: subgridRowIndex,
            };

            if (canvasY !== undefined) {
                this._canvasY = canvasY;
            }

            this._scrollToMakeVisibleEventer(this._currentSubgridPoint.x, this._currentSubgridPoint.y, true);
        }
    }

    setXY(activeColumnIndex: number, subgridRowIndex: number, canvasX?: number, canvasY?: number) {
        if (this._currentSubgridPoint === undefined || this._currentSubgridPoint.x !== activeColumnIndex || this._currentSubgridPoint.y !== subgridRowIndex) {
            this._previousSubgridPoint = this._currentSubgridPoint;
            this._currentSubgridPoint = {
                x: activeColumnIndex,
                y: subgridRowIndex,
            };

            if (canvasX !== undefined) {
                this._canvasX = canvasX;
            }
            if (canvasY !== undefined) {
                this._canvasY = canvasY;
            }

            this._scrollToMakeVisibleEventer(this._currentSubgridPoint.x, this._currentSubgridPoint.y, true);
        }
    }

    isMainSubgridRowFocused(mainSubgridRowIndex: number) {
        return this._currentSubgridPoint !== undefined && mainSubgridRowIndex === this._currentSubgridPoint.y;
    }

    isSubgridRowFocused(subgridRowIndex: number, subgrid: SubgridInterface) {
        return subgrid === this._mainSubgrid && this.isMainSubgridRowFocused(subgridRowIndex);
    }

    adjustForRowsInserted(rowIndex: number, rowCount: number, dataModel: DataModel) {
        if (dataModel === this._mainSubgrid.dataModel) {
            if (this._currentSubgridPoint !== undefined) {
                Point.adjustForYRangeInserted(this._currentSubgridPoint, rowIndex, rowCount);
            }
            if (this._previousSubgridPoint !== undefined) {
                Point.adjustForYRangeInserted(this._previousSubgridPoint, rowIndex, rowCount);
            }

            this._canvasY = undefined;
        }
    }

    adjustForRowsDeleted(rowIndex: number, rowCount: number, dataModel: DataModel) {
        if (dataModel === this._mainSubgrid.dataModel) {
            if (this._currentSubgridPoint !== undefined) {
                const positionInDeletionRange = Point.adjustForYRangeDeleted(this._currentSubgridPoint, rowIndex, rowCount);
                if (positionInDeletionRange !== undefined) {
                    this._currentSubgridPoint = undefined;
                }
            }
            if (this._previousSubgridPoint !== undefined) {
                const positionInDeletionRange = Point.adjustForYRangeDeleted(this._previousSubgridPoint, rowIndex, rowCount);
                if (positionInDeletionRange !== undefined) {
                    this._previousSubgridPoint = undefined;
                }
            }

            this._canvasY = undefined;
        }
    }

    adjustForRowsMoved(oldRowIndex: number, newRowIndex: number, count: number, dataModel: DataModel) {
        if (dataModel === this._mainSubgrid.dataModel) {
            if (this._currentSubgridPoint !== undefined) {
                Point.adjustForYRangeMoved(this._currentSubgridPoint, oldRowIndex, newRowIndex, count);
            }
            if (this._previousSubgridPoint !== undefined) {
                Point.adjustForYRangeMoved(this._previousSubgridPoint, oldRowIndex, newRowIndex, count);
            }

            this._canvasY = undefined;
        }
    }

    adjustForColumnsInserted(columnIndex: number, columnCount: number) {
        if (this._currentSubgridPoint !== undefined) {
            Point.adjustForXRangeInserted(this._currentSubgridPoint, columnIndex, columnCount);
        }
        if (this._previousSubgridPoint !== undefined) {
            Point.adjustForXRangeInserted(this._previousSubgridPoint, columnIndex, columnCount);
        }

        this._canvasX = undefined;
    }

    adjustForColumnsDeleted(columnIndex: number, columnCount: number) {
        if (this._currentSubgridPoint !== undefined) {
            const positionInDeletionRange = Point.adjustForXRangeDeleted(this._currentSubgridPoint, columnIndex, columnCount);
            if (positionInDeletionRange !== undefined) {
                this._currentSubgridPoint = undefined;
            }
        }
        if (this._previousSubgridPoint !== undefined) {
            const positionInDeletionRange = Point.adjustForXRangeDeleted(this._previousSubgridPoint, columnIndex, columnCount);
            if (positionInDeletionRange !== undefined) {
                this._previousSubgridPoint = undefined;
            }
        }

        this._canvasX = undefined;
    }

    adjustForColumnsMoved(oldColumnIndex: number, newColumnIndex: number, count: number) {
        if (this._currentSubgridPoint !== undefined) {
            Point.adjustForXRangeMoved(this._currentSubgridPoint, oldColumnIndex, newColumnIndex, count);
        }
        if (this._previousSubgridPoint !== undefined) {
            Point.adjustForXRangeMoved(this._previousSubgridPoint, oldColumnIndex, newColumnIndex, count);
        }

        this._canvasX = undefined;
    }

    createStash(): Focus.Stash {
        let currentStashPoint: Focus.Stash.Point | undefined;
        if (this._currentSubgridPoint !== undefined) {
            currentStashPoint = this.createStashPoint(this._currentSubgridPoint);
        }
        let previousStashPoint: Focus.Stash.Point | undefined;
        if (this._previousSubgridPoint !== undefined) {
            previousStashPoint = this.createStashPoint(this._previousSubgridPoint);
        }

        return {
            current: currentStashPoint,
            previous: previousStashPoint,
        }
    }

    restoreStash(stash: Focus.Stash) {
        this.clear();

        if (stash.current !== undefined) {
            this._currentSubgridPoint = this.createPointFromStash(stash.current);
        }
        if (stash.previous !== undefined) {
            this._previousSubgridPoint = this.createPointFromStash(stash.previous);
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
