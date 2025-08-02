import { RevClientObject, RevSchemaField } from '../../common';
import { RevColumnsManager } from '../components/column';
import { RevFocus } from '../components/focus';
import { RevSubgridsManager } from '../components/subgrid';
import { RevViewLayout } from '../components/view';
import { RevMainSubgrid, RevSubgrid, RevViewCell } from '../interfaces';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../settings';

export class RevFocusScrollBehavior<BGS extends RevBehavioredGridSettings, BCS extends RevBehavioredColumnSettings, SF extends RevSchemaField> implements RevClientObject {
    private readonly _mainSubgrid: RevMainSubgrid<BCS, SF>;

    constructor(
        readonly clientId: string,
        readonly internalParent: RevClientObject,
        private readonly _gridSettings: RevGridSettings,
        private readonly _columnsManager: RevColumnsManager<BCS, SF>,
        private readonly _subgridsManager: RevSubgridsManager<BCS, SF>,
        private readonly _viewLayout: RevViewLayout<BGS, BCS, SF>,
        private readonly _focus: RevFocus<BGS, BCS, SF>,
    ) {
        this._mainSubgrid = this._subgridsManager.mainSubgrid;
    }

    tryFocusColumnRowAndEnsureInView(activeColumnIndex: number, subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>, cell: RevViewCell<BCS, SF> | undefined): boolean {
        const columnFocusable = this._focus.isColumnFocusable(activeColumnIndex);
        const rowFocusable = this._focus.isSubgridRowFocusable(subgridRowIndex, subgrid);
        if (columnFocusable) {
            if (rowFocusable) {
                if (this.isColumnScrollable(activeColumnIndex) && this.isRowScrollable(subgridRowIndex, subgrid)) {
                    this._viewLayout.ensureColumnRowAreInView(activeColumnIndex, subgridRowIndex, true);
                }
                return this._focus.trySetColumnRow(activeColumnIndex, subgridRowIndex, subgrid, cell, undefined, undefined);
            } else {
                if (this.isColumnScrollable(activeColumnIndex)) {
                    this._viewLayout.ensureColumnIsInView(activeColumnIndex, true)
                }
                return this._focus.trySetColumnIndex(activeColumnIndex, undefined, undefined);
            }
        } else {
            if (rowFocusable) {
                if (this.isRowScrollable(subgridRowIndex, subgrid)) {
                    this._viewLayout.ensureRowIsInView(subgridRowIndex, true);
                }
                return this._focus.trySetSubgridRowIndex(subgridRowIndex, subgrid, undefined, undefined);
            } else {
                return false; // neither column nor row is focusable
            }
        }
    }

    tryFocusColumnAndEnsureInView(activeColumnIndex: number): boolean {
        if (!this._focus.isColumnFocusable(activeColumnIndex)) {
            return false;
        } else {
            // Try to ensure column is in view first so that focus immediately gets ViewCell
            if (this.isColumnScrollable(activeColumnIndex)) {
                this._viewLayout.ensureColumnIsInView(activeColumnIndex, true);
            }
            return this._focus.trySetColumnIndex(activeColumnIndex, undefined, undefined);
        }
    }

    tryFocusSubgridRowAndEnsureInView(subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): boolean {
        if (!this._focus.isSubgridRowFocusable(subgridRowIndex, subgrid)) {
            return false;
        } else {
            // Try to ensure row is in view first so that focus immediately gets ViewCell
            if (this.isRowScrollable(subgridRowIndex, subgrid)) {
                this._viewLayout.ensureRowIsInView(subgridRowIndex, true);
            }
            return this._focus.trySetSubgridRowIndex(subgridRowIndex, subgrid, undefined, undefined);
        }
    }

    tryMoveFocusLeft(): boolean {
        const currentFocusPoint = this._focus.current;
        if (currentFocusPoint !== undefined) {
            const newX = currentFocusPoint.x - 1;
            return this.tryFocusColumnAndEnsureInView(newX);
        } else {
            return false;
        }
    }

    tryMoveFocusRight(): boolean {
        const currentFocusPoint = this._focus.current;
        if (currentFocusPoint !== undefined) {
            const newX = currentFocusPoint.x + 1;
            return this.tryFocusColumnAndEnsureInView(newX);
        } else {
            return false;
        }
    }

    tryMoveFocusUp(): boolean {
        const currentFocusPoint = this._focus.current;
        if (currentFocusPoint !== undefined) {
            const newY = currentFocusPoint.y - 1;
            return this.tryFocusSubgridRowAndEnsureInView(newY, currentFocusPoint.subgrid);
        } else {
            return false;
        }
    }

    tryMoveFocusDown(): boolean {
        const currentFocusPoint = this._focus.current;
        if (currentFocusPoint !== undefined) {
            const newY = currentFocusPoint.y + 1;
            return this.tryFocusSubgridRowAndEnsureInView(newY, currentFocusPoint.subgrid);
        } else {
            return false;
        }
    }

    tryFocusFirstColumn(): boolean {
        const newX = this._gridSettings.fixedColumnCount;
        return this.tryFocusColumnAndEnsureInView(newX);
    }

    tryFocusLastColumn(): boolean {
        const newX = this._columnsManager.activeColumnCount - 1;
        return this.tryFocusColumnAndEnsureInView(newX);
    }

    tryFocusTop(): boolean {
        const subgrids = this._subgridsManager.subgrids;
        const subgridCount = subgrids.length;
        for (let i = 0; i < subgridCount; i++) {
            const subgrid = subgrids[i];
            if (subgrid.focusable) {
                const rowCount = subgrid.getRowCount();
                let newY: number | undefined;
                if (subgrid.scrollable) {
                    const fixedRowCount = this._gridSettings.fixedRowCount;
                    if (rowCount > fixedRowCount) {
                        newY = fixedRowCount;
                    }
                } else {
                    if (rowCount > 0) {
                        newY = 0;
                    }
                }

                if (newY === undefined) {
                    return false; // zero rows or only fixed rows
                } else {
                    return this.tryFocusSubgridRowAndEnsureInView(newY, subgrid);
                }
            }
        }
        return false; // no focusable subgrid
    }

    tryFocusBottom(): boolean {
        const subgrids = this._subgridsManager.subgrids;
        const subgridCount = subgrids.length;
        for (let i = subgridCount - 1; i >= 0; i--) {
            const subgrid = subgrids[i];
            if (subgrid.focusable) {
                const rowCount = subgrid.getRowCount();
                let newY: number | undefined;
                if (subgrid.scrollable) {
                    const fixedRowCount = this._gridSettings.fixedRowCount;
                    if (rowCount > fixedRowCount) {
                        newY = rowCount - 1;
                    }
                } else {
                    if (rowCount > 0) {
                        newY = rowCount - 1;
                    }
                }

                if (newY === undefined) {
                    return false; // zero rows or only fixed rows
                } else {
                    return this.tryFocusSubgridRowAndEnsureInView(newY, subgrid);
                }
            }
        }
        return false; // no focusable subgrid
    }

    tryPageFocusLeft(): boolean {
        const currentFocusPoint = this._focus.current;
        if (currentFocusPoint === undefined) {
            return false;
        } else {
            const anchor = this._viewLayout.calculatePageLeftColumnAnchor();
            if (anchor === undefined) {
                return false;
            } else {
                const activeColumnIndex = anchor.index;
                this._viewLayout.setColumnScrollAnchor(activeColumnIndex, anchor.offset);
                return this._focus.trySetColumnIndex(activeColumnIndex, undefined, undefined);
            }
        }
    }

    tryPageFocusRight(): boolean {
        const currentFocusPoint = this._focus.current;
        if (currentFocusPoint === undefined) {
            return false;
        } else {
            const anchor = this._viewLayout.calculatePageRightColumnAnchor();
            if (anchor === undefined) {
                return false;
            } else {
                const activeColumnIndex = anchor.index;
                this._viewLayout.setColumnScrollAnchor(activeColumnIndex, anchor.offset);
                return this._focus.trySetColumnIndex(activeColumnIndex, undefined, undefined);
            }
        }
    }

    tryPageFocusUp(): boolean {
        const currentFocusPoint = this._focus.current;
        if (currentFocusPoint === undefined) {
            return false;
        } else {
            const anchor = this._viewLayout.calculatePageUpRowAnchor();
            if (anchor === undefined) {
                return false;
            } else {
                const subgridRowIndex = anchor.index;
                this._viewLayout.setRowScrollAnchor(subgridRowIndex, anchor.offset);
                this._focus.trySetSubgridRowIndex(subgridRowIndex, currentFocusPoint.subgrid, undefined, undefined);
                return true;
            }
        }
    }

    tryPageFocusDown(): boolean {
        const currentFocusPoint = this._focus.current;
        if (currentFocusPoint === undefined) {
            return false;
        } else {
            let focusSubgridRowIndex = this._focus.currentSubgridRowIndex;
            if (focusSubgridRowIndex === undefined) {
                focusSubgridRowIndex = this._viewLayout.lastScrollableRowSubgridRowIndex;
            }
            if (focusSubgridRowIndex === undefined) {
                return false;
            } else {
                let newAnchorIndex = focusSubgridRowIndex;
                const dimension = this._viewLayout.verticalScrollDimension;
                const dimensionSize = dimension.size;
                const dimensionViewportSize = dimension.viewportSize;
                let newFocusSubgridRowIndex: number;
                if (newAnchorIndex + dimension.viewportSize <= dimensionSize) {
                    newFocusSubgridRowIndex = focusSubgridRowIndex + dimensionViewportSize - 1;
                } else {
                    newAnchorIndex = dimensionSize - dimensionViewportSize;
                    newFocusSubgridRowIndex = dimensionSize - 1;
                }
                this._viewLayout.setRowScrollAnchor(newAnchorIndex, 0);
                this._focus.trySetSubgridRowIndex(newFocusSubgridRowIndex, currentFocusPoint.subgrid, undefined, undefined);
                return true;
            }
        }
    }

    tryScrollLeft(): boolean {
        const activeColumnIndex = this._viewLayout.firstScrollableActiveColumnIndex;
        if (activeColumnIndex !== undefined) {
            return this._viewLayout.setColumnScrollAnchor(activeColumnIndex - 1, 0); // viewLayout will limit
        } else {
            return false;
        }
    }

    tryScrollRight(): boolean {
        const activeColumnIndex = this._viewLayout.firstScrollableActiveColumnIndex;
        if (activeColumnIndex !== undefined) {
            return this._viewLayout.setColumnScrollAnchor(activeColumnIndex + 1, 0); // viewLayout will limit
        } else {
            return false;
        }
    }

    tryScrollUp(): boolean {
        const rowIndex = this._viewLayout.firstScrollableSubgridRowIndex;
        if (rowIndex !== undefined) {
            return this._viewLayout.setRowScrollAnchor(rowIndex - 1, 0); // viewLayout will limit
        } else {
            return false;
        }
    }

    tryScrollDown(): boolean {
        const rowIndex = this._viewLayout.firstScrollableSubgridRowIndex;
        if (rowIndex !== undefined) {
            return this._viewLayout.setRowScrollAnchor(rowIndex + 1, 0); // viewLayout will limit
        } else {
            return false;
        }
    }

    scrollFirstColumn(): boolean {
        return this._viewLayout.setColumnScrollAnchor(this._gridSettings.fixedColumnCount, 0); // viewLayout will limit
    }

    scrollLastColumn(): boolean {
        return this._viewLayout.setColumnScrollAnchor(this._columnsManager.activeColumnCount, 0); // viewLayout will limit
    }

    scrollTop(): boolean {
        return this._viewLayout.setRowScrollAnchor(this._gridSettings.fixedRowCount, 0);
    }

    scrollBottom(): boolean {
        return this._viewLayout.setRowScrollAnchor(this._mainSubgrid.getRowCount(), 0); // viewLayout will limit
    }

    tryScrollPageLeft(): boolean {
        const anchor = this._viewLayout.calculatePageLeftColumnAnchor();
        if (anchor !== undefined) {
            return this._viewLayout.setColumnScrollAnchor(anchor.index, anchor.offset);
        } else {
            return false;
        }
    }

    tryScrollPageRight(): boolean {
        const anchor = this._viewLayout.calculatePageRightColumnAnchor();
        if (anchor !== undefined) {
            return this._viewLayout.setColumnScrollAnchor(anchor.index, anchor.offset);
        } else {
            return false;
        }
    }

    tryScrollPageUp(): boolean {
        const anchor = this._viewLayout.calculatePageUpRowAnchor();
        if (anchor !== undefined) {
            return this._viewLayout.setRowScrollAnchor(anchor.index, anchor.offset);
        } else {
            return false;
        }
    }

    tryScrollPageDown(): boolean {
        const anchor = this._viewLayout.calculatePageDownRowAnchor();
        if (anchor !== undefined) {
            return this._viewLayout.setRowScrollAnchor(anchor.index, anchor.offset);
        } else {
            return false;
        }
    }

    /**
     * Scroll up one full page.
     */
    // scrollPageUp() {
    //     const firstScrollableSubgridRowIndex = this.gridProperties.fixedRowCount;
    //     const currentFocusY = currentFocusPoint.y;
    //     if (currentFocusY > firstScrollableSubgridRowIndex) {
    //         const lastViewportScrollableSubgridRowIndex = this.viewport.lastScrollableSubgridRowIndex;
    //         if (lastViewportScrollableSubgridRowIndex !== undefined) {
    //             const firstViewportScrollableSubgridRowIndex = this.viewport.firstScrollableSubgridRowIndex;
    //             if (firstViewportScrollableSubgridRowIndex === undefined) {
    //                 throw new AssertError('FUBNYPU87521');
    //             } else {
    //                 let maxScrollCount = lastViewportScrollableSubgridRowIndex - firstScrollableSubgridRowIndex;
    //                 if (maxScrollCount === 0) {
    //                     maxScrollCount = 1;
    //                 }
    //                 let newFocusY = currentFocusY - maxScrollCount;
    //                 if (newFocusY < firstScrollableSubgridRowIndex) {
    //                     newFocusY = firstScrollableSubgridRowIndex;
    //                 }
    //                 this.focus.setYCoordinate(newFocusY);
    //             }
    //         }
    //     }
    // }

    /**
     * Scroll down one full page.
     */
    // scrollPageDown() {
    //     const lastScrollableSubgridRowIndex = this.mainSubgrid.getRowCount() - 1;
    //     const currentFocusY = currentFocusPoint.y;
    //     if (currentFocusY < lastScrollableSubgridRowIndex) {
    //         const lastViewportScrollableSubgridRowIndex = this.viewport.lastScrollableSubgridRowIndex;
    //         if (lastViewportScrollableSubgridRowIndex !== undefined) {
    //             const firstViewportScrollableSubgridRowIndex = this.viewport.firstScrollableSubgridRowIndex;
    //             if (firstViewportScrollableSubgridRowIndex === undefined) {
    //                 throw new AssertError('FUBNXPD87521');
    //             } else {
    //                 let maxScrollCount = lastViewportScrollableSubgridRowIndex - lastScrollableSubgridRowIndex;
    //                 if (maxScrollCount === 0) {
    //                     maxScrollCount = 1;
    //                 }
    //                 let newFocusY = currentFocusY + maxScrollCount;
    //                 if (newFocusY > lastScrollableSubgridRowIndex) {
    //                     newFocusY = lastScrollableSubgridRowIndex;
    //                 }
    //                 this.focus.setYCoordinate(newFocusY);
    //             }
    //         }
    //     }
    //     const rowNum = this._viewport.getPageDownRow();
    //     if (rowNum === undefined) {
    //         return undefined;
    //     } else {
    //         this.handleVScrollerChange(rowNum);
    //         return rowNum;
    //     }
    // }

    // scrollPageLeft() {
    //     const currentFocusSubgridX = this._focus.currentSubgridX;
    //     if (currentFocusSubgridX !== undefined) {
    //         const viewportFocusOffset = this.calculateViewportFocusOffset();
    //         const firstScrollableActiveColumnIndex = this._gridProperties.fixedColumnCount;
    //         if (currentFocusSubgridX > firstScrollableActiveColumnIndex) {
    //             this._viewport.getPageDownRow
    //             const lastViewportScrollableActiveColumnIndex = this.viewport.lastScrollableActiveColumnIndex;
    //             if (lastViewportScrollableActiveColumnIndex !== undefined) {
    //                 const firstViewportScrollableActiveColumnIndex = this.viewport.firstScrollableActiveColumnIndex;
    //                 if (firstViewportScrollableActiveColumnIndex === undefined) {
    //                     throw new AssertError('FUBNXPU87521');
    //                 } else {
    //                     let maxScrollCount = lastViewportScrollableActiveColumnIndex - firstScrollableActiveColumnIndex;
    //                     if (maxScrollCount === 0) {
    //                         maxScrollCount = 1;
    //                     }
    //                     let newFocusX = currentFocusSubgridX - maxScrollCount;
    //                     if (newFocusX < firstScrollableActiveColumnIndex) {
    //                         newFocusX = firstScrollableActiveColumnIndex;
    //                     }
    //                     this.focus.setXCoordinate(newFocusX);
    //                 }
    //             }
    //         }
    //     }
    // }

    // scrollPageRight() {
    //     const lastScrollableActiveColumnIndex = this.columnsManager.activeColumnCount - 1;
    //     const currentFocusX = currentFocusPoint.x;
    //     if (currentFocusX < lastScrollableActiveColumnIndex) {
    //         const lastViewportScrollableActiveColumnIndex = this.viewport.lastScrollableActiveColumnIndex;
    //         if (lastViewportScrollableActiveColumnIndex !== undefined) {
    //             const firstViewportScrollableActiveColumnIndex = this.viewport.firstScrollableActiveColumnIndex;
    //             if (firstViewportScrollableActiveColumnIndex === undefined) {
    //                 throw new AssertError('FUBNXPF87521');
    //             } else {
    //                 let maxScrollCount = lastViewportScrollableActiveColumnIndex - lastScrollableActiveColumnIndex;
    //                 if (maxScrollCount === 0) {
    //                     maxScrollCount = 1;
    //                 }
    //                 let newFocusX = currentFocusX + maxScrollCount;
    //                 if (newFocusX > lastScrollableActiveColumnIndex) {
    //                     newFocusX = lastScrollableActiveColumnIndex;
    //                 }
    //                 this.focus.setXCoordinate(newFocusX);
    //             }
    //         }
    //     }
    // }

    tryStepScroll(directionCanvasOffsetX: number, directionCanvasOffsetY: number): boolean {
        let stepped = this.tryStepScrollColumn(directionCanvasOffsetX);
        if (this.tryStepScrollRow(directionCanvasOffsetY)) {
            stepped = true;
        }
        return stepped;
    }

    tryStepScrollColumn(directionCanvasOffsetX: number): boolean {
        const viewLayout = this._viewLayout;
        const scrollableBounds = viewLayout.scrollableCanvasBounds;
        if (scrollableBounds === undefined) {
            return false;
        } else {
            let wantedMaximallyVisibleActiveColumnIndex: number | undefined;

            if (directionCanvasOffsetX < scrollableBounds.topLeft.x) {
                const firstVisibleScrollableColumnLeftOverflow = viewLayout.firstScrollableColumnLeftOverflow;
                const firstVisibleScrollableActiveColumnIndex = viewLayout.firstScrollableActiveColumnIndex;
                if (firstVisibleScrollableColumnLeftOverflow !== undefined && firstVisibleScrollableActiveColumnIndex !== undefined) {
                    const scrollableVisibleColumnCount = this._viewLayout.scrollableColumnCount;
                    if (firstVisibleScrollableColumnLeftOverflow > 0 && scrollableVisibleColumnCount > 1) {
                        wantedMaximallyVisibleActiveColumnIndex = firstVisibleScrollableActiveColumnIndex;
                    } else {
                        if (firstVisibleScrollableActiveColumnIndex > this._columnsManager.getFixedColumnCount()) {
                            wantedMaximallyVisibleActiveColumnIndex = firstVisibleScrollableActiveColumnIndex - 1;
                        }
                    }
                }
            } else {
                if (directionCanvasOffsetX > scrollableBounds.topLeft.x + scrollableBounds.extent.x) {
                    const lastVisibleScrollableColumnLeftOverflow = viewLayout.lastScrollableColumnRightOverflow;
                    const lastVisibleScrollableActiveColumnIndex = viewLayout.lastScrollableActiveColumnIndex;

                    if (lastVisibleScrollableColumnLeftOverflow !== undefined && lastVisibleScrollableActiveColumnIndex !== undefined) {
                        const scrollableVisibleColumnCount = this._viewLayout.scrollableColumnCount;
                        if (lastVisibleScrollableColumnLeftOverflow > 0 && scrollableVisibleColumnCount > 1) {
                            wantedMaximallyVisibleActiveColumnIndex = lastVisibleScrollableActiveColumnIndex;
                        } else {
                            const lastScrollableActiveColumnIndex = this._columnsManager.activeColumnCount - 1;
                            if (lastVisibleScrollableActiveColumnIndex < lastScrollableActiveColumnIndex) {
                                wantedMaximallyVisibleActiveColumnIndex = lastVisibleScrollableActiveColumnIndex + 1;
                            }
                        }
                    }
                }
            }

            if (wantedMaximallyVisibleActiveColumnIndex === undefined) {
                return false;
            } else {
                this._viewLayout.ensureColumnIsInView(wantedMaximallyVisibleActiveColumnIndex, true);
                return true;
            }
        }
    }

    tryStepScrollRow(directionCanvasOffsetY: number): boolean {
        const viewLayout = this._viewLayout;
        const scrollableBounds = viewLayout.scrollableCanvasBounds;

        if (scrollableBounds === undefined) {
            return false;
        } else {
            if (directionCanvasOffsetY < scrollableBounds.topLeft.y) {
                return this._viewLayout.scrollVerticalViewportBy(-1);
            } else {
                if (directionCanvasOffsetY >= scrollableBounds.exclusiveBottom) {
                    return this._viewLayout.scrollVerticalViewportBy(+1);
                } else {
                    return false;
                }
            }
        }
    }

    private isColumnScrollable(activeColumnIndex: number): boolean {
        return activeColumnIndex >= this._gridSettings.fixedColumnCount && activeColumnIndex < this._columnsManager.activeColumnCount
    }

    private isRowScrollable(subgridRowIndex: number, subgrid: RevSubgrid<BCS, SF>): boolean {
        return subgrid.scrollable && subgridRowIndex >= this._gridSettings.fixedRowCount && subgridRowIndex < subgrid.getRowCount()
    }
}

export namespace RevFocusScrollBehavior {
    export type ScrollXToMakeVisibleEventer = (this: void, x: number) => void;
    export type ScrollYToMakeVisibleEventer = (this: void, y: number) => void;
    export type ScrollXYToMakeVisibleEventer = (this: void, x: number, y: number) => void;
}
