import { ViewportCell } from '../../cell/viewport-cell';
import { EventDetail } from '../../event/event-detail';
import { Point } from '../../lib/point';
import { AssertError, UnreachableCaseError } from '../../lib/revgrid-error';
import { UiBehavior } from './ui-behavior';

export class FocusUiBehavior extends UiBehavior {
    readonly typeName = FocusUiBehavior.typeName;

    override handleMouseDown(event: MouseEvent, cell: ViewportCell | null | undefined) {
        if (cell === undefined) {
            cell = this.tryGetViewportCellFromMouseEvent(event);
        }
        if (cell !== null) {
            if (cell.subgrid.isMain) {
                this.focus.setXYCoordinates(cell.visibleColumn.activeColumnIndex, cell.visibleRow.subgridRowIndex);
            }
        }
        return super.handleMouseDown(event, cell);
    }

    /**
     * @param eventDetail - the event details
     */
    override handleKeyDown(eventDetail: EventDetail.Keyboard) {
        const currentFocusPoint = this.focus.current;
        if (currentFocusPoint !== undefined) {
            const navigateKey = eventDetail.revgrid_navigateKey;
            if (navigateKey !== undefined) {
                switch (navigateKey) {
                    case EventDetail.Keyboard.NavigateKey.left:
                        this.processNavigateKeyLeft(currentFocusPoint);
                        break;
                    case EventDetail.Keyboard.NavigateKey.right:
                        this.processNavigateKeyRight(currentFocusPoint);
                        break;
                    case EventDetail.Keyboard.NavigateKey.up:
                        this.processNavigateKeyUp(currentFocusPoint);
                        break;
                    case EventDetail.Keyboard.NavigateKey.down:
                        this.processNavigateKeyDown(currentFocusPoint);
                        break;
                    case EventDetail.Keyboard.NavigateKey.pageUp:
                        this.processNavigateKeyPageUp(currentFocusPoint, eventDetail.altKey);
                        break;
                    case EventDetail.Keyboard.NavigateKey.pageDown:
                        this.processNavigateKeyPageDown(currentFocusPoint, eventDetail.altKey);
                        break;
                    case EventDetail.Keyboard.NavigateKey.home:
                        this.processNavigateKeyHome(currentFocusPoint, eventDetail.ctrlKey);
                        break;
                    case EventDetail.Keyboard.NavigateKey.end:
                        this.processNavigateKeyEnd(currentFocusPoint, eventDetail.ctrlKey);
                        break;
                    default:
                        throw new UnreachableCaseError('FUBHKD33233', navigateKey);
                }
            }
        }
        super.handleKeyDown(eventDetail);

        // // STEP 1: Move the selection
        // if (handler) {
        //     handler.call(this, eventDetail.primitiveEvent);

        //     // STEP 2: Open the cell editor at the new position if `editable` AND edited cell had `editOnNextCell`
        //     let cellEvent = grid.getFocusedCellEvent(true);
        //     if (cellEvent !== undefined) {
        //         if (cellEvent.columnProperties.editOnNextCell) {
        //             grid.viewport.computeCellsBounds(); // moving selection may have auto-scrolled
        //             cellEvent = grid.getFocusedCellEvent(false); // new cell
        //             if (cellEvent !== undefined) {
        //                 grid.editAt(cellEvent); // succeeds only if `editable`
        //             }
        //         }
        //     }

        //     // STEP 3: If editor not opened on new cell, take focus
        //     if (!grid.cellEditor) {
        //         grid.takeFocus();
        //     }
        // } else {
        //     super.handleKeyDown(eventDetail);
        // }
    }

    private processNavigateKeyLeft(currentFocusPoint: Point) {
        const firstScrollableActiveColumnIndex = this.gridProperties.fixedColumnCount;
        const currentFocusX = currentFocusPoint.x;
        if (currentFocusX > firstScrollableActiveColumnIndex) {
            this.focus.setXCoordinate(currentFocusX - 1);
        }
    }

    private processNavigateKeyRight(currentFocusPoint: Point) {
        const lastScrollableActiveColumnIndex = this.columnsManager.activeColumnCount - 1;
        const currentFocusX = currentFocusPoint.x;
        if (currentFocusX < lastScrollableActiveColumnIndex) {
            this.focus.setXCoordinate(currentFocusX + 1);
        }
    }

    private processNavigateKeyUp(currentFocusPoint: Point) {
        const firstScrollableSubgridRowIndex = this.gridProperties.fixedRowCount;
        const currentFocusY = currentFocusPoint.y;
        if (currentFocusY > firstScrollableSubgridRowIndex) {
            this.focus.setYCoordinate(currentFocusY - 1);
        }
    }

    private processNavigateKeyDown(currentFocusPoint: Point) {
        const lastScrollableSubgridRowIndex = this.mainSubgrid.getRowCount() - 1;
        const currentFocusY = currentFocusPoint.y;
        if (currentFocusY < lastScrollableSubgridRowIndex) {
            this.focus.setYCoordinate(currentFocusY + 1);
        }
    }

    private processNavigateKeyPageUp(currentFocusPoint: Point, xDirection: boolean) {
        if (xDirection) {
            this.navigatePageLeft(currentFocusPoint);
        } else {
            this.navigatePageUp(currentFocusPoint);
        }
    }

    private navigatePageLeft(currentFocusPoint: Point) {
        const firstScrollableActiveColumnIndex = this.gridProperties.fixedColumnCount;
        const currentFocusX = currentFocusPoint.x;
        if (currentFocusX > firstScrollableActiveColumnIndex) {
            const lastViewportScrollableActiveColumnIndex = this.viewport.lastScrollableActiveColumnIndex;
            if (lastViewportScrollableActiveColumnIndex !== undefined) {
                const firstViewportScrollableActiveColumnIndex = this.viewport.firstScrollableActiveColumnIndex;
                if (firstViewportScrollableActiveColumnIndex === undefined) {
                    throw new AssertError('FUBNXPU87521');
                } else {
                    let maxScrollCount = lastViewportScrollableActiveColumnIndex - firstScrollableActiveColumnIndex;
                    if (maxScrollCount === 0) {
                        maxScrollCount = 1;
                    }
                    let newFocusX = currentFocusX - maxScrollCount;
                    if (newFocusX < firstScrollableActiveColumnIndex) {
                        newFocusX = firstScrollableActiveColumnIndex;
                    }
                    this.focus.setXCoordinate(newFocusX);
                }
            }
        }
    }

    private navigatePageUp(currentFocusPoint: Point) {
        const firstScrollableSubgridRowIndex = this.gridProperties.fixedRowCount;
        const currentFocusY = currentFocusPoint.y;
        if (currentFocusY > firstScrollableSubgridRowIndex) {
            const lastViewportScrollableSubgridRowIndex = this.viewport.lastScrollableSubgridRowIndex;
            if (lastViewportScrollableSubgridRowIndex !== undefined) {
                const firstViewportScrollableSubgridRowIndex = this.viewport.firstScrollableSubgridRowIndex;
                if (firstViewportScrollableSubgridRowIndex === undefined) {
                    throw new AssertError('FUBNYPU87521');
                } else {
                    let maxScrollCount = lastViewportScrollableSubgridRowIndex - firstScrollableSubgridRowIndex;
                    if (maxScrollCount === 0) {
                        maxScrollCount = 1;
                    }
                    let newFocusY = currentFocusY - maxScrollCount;
                    if (newFocusY < firstScrollableSubgridRowIndex) {
                        newFocusY = firstScrollableSubgridRowIndex;
                    }
                    this.focus.setYCoordinate(newFocusY);
                }
            }
        }
    }

    private processNavigateKeyPageDown(currentFocusPoint: Point, xDirection: boolean) {
        if (xDirection) {
            this.navigatePageRight(currentFocusPoint);
        } else {
            this.navigatePageDown(currentFocusPoint);
        }
    }

    private navigatePageRight(currentFocusPoint: Point) {
        const lastScrollableActiveColumnIndex = this.columnsManager.activeColumnCount - 1;
        const currentFocusX = currentFocusPoint.x;
        if (currentFocusX < lastScrollableActiveColumnIndex) {
            const lastViewportScrollableActiveColumnIndex = this.viewport.lastScrollableActiveColumnIndex;
            if (lastViewportScrollableActiveColumnIndex !== undefined) {
                const firstViewportScrollableActiveColumnIndex = this.viewport.firstScrollableActiveColumnIndex;
                if (firstViewportScrollableActiveColumnIndex === undefined) {
                    throw new AssertError('FUBNXPF87521');
                } else {
                    let maxScrollCount = lastViewportScrollableActiveColumnIndex - lastScrollableActiveColumnIndex;
                    if (maxScrollCount === 0) {
                        maxScrollCount = 1;
                    }
                    let newFocusX = currentFocusX + maxScrollCount;
                    if (newFocusX > lastScrollableActiveColumnIndex) {
                        newFocusX = lastScrollableActiveColumnIndex;
                    }
                    this.focus.setXCoordinate(newFocusX);
                }
            }
        }
    }

    private navigatePageDown(currentFocusPoint: Point) {
        const lastScrollableSubgridRowIndex = this.mainSubgrid.getRowCount() - 1;
        const currentFocusY = currentFocusPoint.y;
        if (currentFocusY < lastScrollableSubgridRowIndex) {
            const lastViewportScrollableSubgridRowIndex = this.viewport.lastScrollableSubgridRowIndex;
            if (lastViewportScrollableSubgridRowIndex !== undefined) {
                const firstViewportScrollableSubgridRowIndex = this.viewport.firstScrollableSubgridRowIndex;
                if (firstViewportScrollableSubgridRowIndex === undefined) {
                    throw new AssertError('FUBNXPD87521');
                } else {
                    let maxScrollCount = lastViewportScrollableSubgridRowIndex - lastScrollableSubgridRowIndex;
                    if (maxScrollCount === 0) {
                        maxScrollCount = 1;
                    }
                    let newFocusY = currentFocusY + maxScrollCount;
                    if (newFocusY > lastScrollableSubgridRowIndex) {
                        newFocusY = lastScrollableSubgridRowIndex;
                    }
                    this.focus.setYCoordinate(newFocusY);
                }
            }
        }
    }

    private processNavigateKeyHome(currentFocusPoint: Point, yDirection: boolean) {
        if (yDirection) {
            this.navigateFirstRow(currentFocusPoint);
        } else {
            this.navigateFirstColumn(currentFocusPoint);
        }
    }

    private navigateFirstColumn(currentFocusPoint: Point) {
        const firstScrollableActiveColumnIndex = this.gridProperties.fixedColumnCount;
        const currentFocusX = currentFocusPoint.x;
        if (currentFocusX > firstScrollableActiveColumnIndex) {
            this.focus.setXCoordinate(firstScrollableActiveColumnIndex);
        }
    }

    private navigateFirstRow(currentFocusPoint: Point) {
        const firstScrollableSubgridRowIndex = this.gridProperties.fixedRowCount;
        const currentFocusY = currentFocusPoint.y;
        if (currentFocusY > firstScrollableSubgridRowIndex) {
            this.focus.setYCoordinate(firstScrollableSubgridRowIndex);
        }
    }

    private processNavigateKeyEnd(currentFocusPoint: Point, yDirection: boolean) {
        if (yDirection) {
            this.navigateLastRow(currentFocusPoint);
        } else {
            this.navigateLastColumn(currentFocusPoint);
        }
    }

    private navigateLastColumn(currentFocusPoint: Point) {
        const lastScrollableActiveColumnIndex = this.columnsManager.activeColumnCount - 1;
        const currentFocusX = currentFocusPoint.x;
        if (currentFocusX < lastScrollableActiveColumnIndex) {
            this.focus.setXCoordinate(lastScrollableActiveColumnIndex);
        }
    }

    private navigateLastRow(currentFocusPoint: Point) {
        const lastScrollableSubgridRowIndex = this.mainSubgrid.getRowCount() - 1;
        const currentFocusY = currentFocusPoint.y;
        if (currentFocusY < lastScrollableSubgridRowIndex) {
            this.focus.setYCoordinate(lastScrollableSubgridRowIndex);
        }
    }
}

export namespace FocusUiBehavior {
    export const typeName = 'focus';
}
