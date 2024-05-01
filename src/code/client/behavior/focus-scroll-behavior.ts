import { RevClientObject } from '../../common/internal-api';
import { RevColumnsManager } from '../components/column/columns-manager';
import { RevFocus } from '../components/focus/focus';
import { RevSubgridsManager } from '../components/subgrid/subgrids-manager';
import { RevViewLayout } from '../components/view/view-layout';
import { RevMainSubgrid } from '../interfaces/data/main-subgrid';
import { RevViewCell } from '../interfaces/data/view-cell';
import { RevSchemaField } from '../interfaces/schema/schema-field';
import { RevBehavioredColumnSettings, RevBehavioredGridSettings, RevGridSettings } from '../settings/internal-api';

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

    tryFocusXYAndEnsureInView(x: number, y: number, cell: RevViewCell<BCS, SF> | undefined) {
        const xScrollable = this.isXScrollable(x);
        const yScrollable = this.isYScrollable(y);
        if (xScrollable) {
            if (yScrollable) {
                this._viewLayout.ensureColumnRowAreInView(x, y, true)
                this._focus.setXY(x, y, cell, undefined, undefined);
            } else {
                this._viewLayout.ensureColumnIsInView(x, true)
                this._focus.setX(x, undefined, undefined);
            }
            return true;
        } else {
            if (yScrollable) {
                this._viewLayout.ensureRowIsInView(y, true)
                this._focus.setY(y, undefined, undefined);
                return true;
            } else {
                return false;
            }
        }
    }

    tryFocusXAndEnsureInView(x: number) {
        if (this.isXScrollable(x)) {
            this._viewLayout.ensureColumnIsInView(x, true)
            this._focus.setX(x, undefined, undefined);
            return true;
        } else {
            return false;
        }
    }

    tryFocusYAndEnsureInView(y: number) {
        if (this.isYScrollable(y)) {
            this._viewLayout.ensureRowIsInView(y, true)
            this._focus.setY(y, undefined, undefined);
            return true;
        } else {
            return false;
        }
    }

    tryMoveFocusLeft() {
        const currentFocusPoint = this._focus.current;
        if (currentFocusPoint !== undefined) {
            const newX = currentFocusPoint.x - 1;
            return this.tryFocusXAndEnsureInView(newX);
        } else {
            return false;
        }
    }

    tryMoveFocusRight() {
        const currentFocusPoint = this._focus.current;
        if (currentFocusPoint !== undefined) {
            const newX = currentFocusPoint.x + 1;
            return this.tryFocusXAndEnsureInView(newX);
        } else {
            return false;
        }
    }

    tryMoveFocusUp() {
        const currentFocusPoint = this._focus.current;
        if (currentFocusPoint !== undefined) {
            const newY = currentFocusPoint.y - 1;
            return this.tryFocusYAndEnsureInView(newY);
        } else {
            return false;
        }
    }

    tryMoveFocusDown() {
        const currentFocusPoint = this._focus.current;
        if (currentFocusPoint !== undefined) {
            const newY = currentFocusPoint.y + 1;
            return this.tryFocusYAndEnsureInView(newY);
        } else {
            return false;
        }
    }

    tryFocusFirstColumn() {
        const newX = this._gridSettings.fixedColumnCount;
        return this.tryFocusYAndEnsureInView(newX);
    }

    tryFocusLastColumn() {
        const newX = this._columnsManager.activeColumnCount - 1;
        return this.tryFocusYAndEnsureInView(newX);
    }

    tryFocusTop() {
        const newY = this._gridSettings.fixedRowCount;
        return this.tryFocusYAndEnsureInView(newY);
    }

    tryFocusBottom() {
        const newY = this._mainSubgrid.getRowCount() - 1;
        return this.tryFocusYAndEnsureInView(newY);
    }

    tryPageFocusLeft() {
        const anchor = this._viewLayout.calculatePageLeftColumnAnchor();
        if (anchor === undefined) {
            return false;
        } else {
            const activeColumnIndex = anchor.index;
            this._viewLayout.setColumnScrollAnchor(activeColumnIndex, anchor.offset);
            this._focus.setX(activeColumnIndex, undefined, undefined);
            return true;
        }
    }

    tryPageFocusRight() {
        const anchor = this._viewLayout.calculatePageRightColumnAnchor();
        if (anchor === undefined) {
            return false;
        } else {
            const activeColumnIndex = anchor.index;
            this._viewLayout.setColumnScrollAnchor(activeColumnIndex, anchor.offset);
            this._focus.setX(activeColumnIndex, undefined, undefined);
            return true;
        }
    }

    tryPageFocusUp() {
        const anchor = this._viewLayout.calculatePageUpRowAnchor();
        if (anchor === undefined) {
            return false;
        } else {
            const rowIndex = anchor.index;
            this._viewLayout.setRowScrollAnchor(rowIndex, anchor.offset);
            this._focus.setY(rowIndex, undefined, undefined);
            return true;
        }
    }

    tryPageFocusDown() {
        let focusY = this._focus.currentY;
        if (focusY === undefined) {
            focusY = this._viewLayout.lastScrollableRowSubgridRowIndex;
        }
        if (focusY === undefined) {
            return false;
        } else {
            let newAnchorIndex = focusY;
            const dimension = this._viewLayout.verticalScrollDimension;
            const dimensionSize = dimension.size;
            const dimensionViewportSize = dimension.viewportSize;
            let newFocusY: number;
            if (newAnchorIndex + dimension.viewportSize <= dimensionSize) {
                newFocusY = focusY + dimensionViewportSize - 1;
            } else {
                newAnchorIndex = dimensionSize - dimensionViewportSize;
                newFocusY = dimensionSize - 1;
            }
            this._viewLayout.setRowScrollAnchor(newAnchorIndex, 0);
            this._focus.setY(newFocusY, undefined, undefined);
            return true;
        }
    }

    tryScrollLeft() {
        const activeColumnIndex = this._viewLayout.firstScrollableActiveColumnIndex;
        if (activeColumnIndex !== undefined) {
            return this._viewLayout.setColumnScrollAnchor(activeColumnIndex - 1, 0); // viewLayout will limit
        } else {
            return false;
        }
    }

    tryScrollRight() {
        const activeColumnIndex = this._viewLayout.firstScrollableActiveColumnIndex;
        if (activeColumnIndex !== undefined) {
            return this._viewLayout.setColumnScrollAnchor(activeColumnIndex + 1, 0); // viewLayout will limit
        } else {
            return false;
        }
    }

    tryScrollUp() {
        const rowIndex = this._viewLayout.firstScrollableSubgridRowIndex;
        if (rowIndex !== undefined) {
            return this._viewLayout.setRowScrollAnchor(rowIndex - 1, 0); // viewLayout will limit
        } else {
            return false;
        }
    }

    tryScrollDown() {
        const rowIndex = this._viewLayout.firstScrollableSubgridRowIndex;
        if (rowIndex !== undefined) {
            return this._viewLayout.setRowScrollAnchor(rowIndex + 1, 0); // viewLayout will limit
        } else {
            return false;
        }
    }

    scrollFirstColumn() {
        return this._viewLayout.setColumnScrollAnchor(this._gridSettings.fixedColumnCount, 0); // viewLayout will limit
    }

    scrollLastColumn() {
        return this._viewLayout.setColumnScrollAnchor(this._columnsManager.activeColumnCount, 0); // viewLayout will limit
    }

    scrollTop() {
        return this._viewLayout.setRowScrollAnchor(this._gridSettings.fixedRowCount, 0);
    }

    scrollBottom() {
        return this._viewLayout.setRowScrollAnchor(this._mainSubgrid.getRowCount(), 0); // viewLayout will limit
    }

    tryScrollPageLeft() {
        const anchor = this._viewLayout.calculatePageLeftColumnAnchor();
        if (anchor !== undefined) {
            return this._viewLayout.setColumnScrollAnchor(anchor.index, anchor.offset);
        } else {
            return false;
        }
    }

    tryScrollPageRight() {
        const anchor = this._viewLayout.calculatePageRightColumnAnchor();
        if (anchor !== undefined) {
            return this._viewLayout.setColumnScrollAnchor(anchor.index, anchor.offset);
        } else {
            return false;
        }
    }

    tryScrollPageUp() {
        const anchor = this._viewLayout.calculatePageUpRowAnchor();
        if (anchor !== undefined) {
            return this._viewLayout.setRowScrollAnchor(anchor.index, anchor.offset);
        } else {
            return false;
        }
    }

    tryScrollPageDown() {
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

    tryStepScroll(directionCanvasOffsetX: number, directionCanvasOffsetY: number) {
        let stepped = this.tryStepScrollColumn(directionCanvasOffsetX);
        if (this.tryStepScrollRow(directionCanvasOffsetY)) {
            stepped = true;
        }
        return stepped;
    }

    tryStepScrollColumn(directionCanvasOffsetX: number) {
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

    tryStepScrollRow(directionCanvasOffsetY: number) {
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

    private isXScrollable(x: number) {
        return x >= this._gridSettings.fixedColumnCount && x < this._columnsManager.activeColumnCount
    }

    private isYScrollable(y: number) {
        return y >= this._gridSettings.fixedRowCount && y < this._mainSubgrid.getRowCount()
    }
}

export namespace RevFocusScrollBehavior {
    export type ScrollXToMakeVisibleEventer = (this: void, x: number) => void;
    export type ScrollYToMakeVisibleEventer = (this: void, y: number) => void;
    export type ScrollXYToMakeVisibleEventer = (this: void, x: number, y: number) => void;
}
