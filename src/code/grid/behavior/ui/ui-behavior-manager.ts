import { CanvasEx } from '../../canvas/canvas-ex';
import { ViewportCell } from '../../cell/viewport-cell';
import { ColumnsManager } from '../../column/columns-manager';
import { EventDetail } from '../../event/event-detail';
import { Focus } from '../../focus';
import { GridProperties } from '../../grid-properties';
import { Renderer } from '../../renderer/renderer';
import { Viewport } from '../../renderer/viewport';
import { Revgrid } from '../../revgrid';
import { Selection } from '../../selection/selection';
import { SubgridsManager } from '../../subgrid/subgrids-manager';
import { Mouse } from '../../user-interface-input/mouse';
import { CellPropertiesBehavior } from '../cell-properties-behavior';
import { EventBehavior } from '../event-behavior';
import { FocusSelectionBehavior } from '../focus-selection-behavior';
import { RowPropertiesBehavior } from '../row-properties-behavior';
import { ScrollBehavior } from '../scroll-behaviour';
import { UserInterfaceInputBehavior } from '../user-interface-input-behavior';
import { UiBehavior } from './ui-behavior';
import { UiBehaviorFactory } from './ui-behavior-factory';
import { UiBehaviorServices } from './ui-behavior-services';
import { UiBehaviorSharedState } from './ui-behavior-shared-state';

/** @internal */
export class UiBehaviorManager {
    private _uiBehaviorMap = new Map<string, UiBehavior>();
    private _firstUiBehavior: UiBehavior;
    private _enabled = false;

    readonly _sharedState: UiBehaviorSharedState; // Will be initialised in constructor
    readonly _services: UiBehaviorServices;

    constructor(
        private readonly grid: Revgrid, // remove in future
        gridProperties: GridProperties,
        mouse: Mouse,
        canvasEx: CanvasEx,
        focus: Focus,
        selection: Selection,
        columnsManager: ColumnsManager,
        subgridsManager: SubgridsManager,
        viewport: Viewport,
        renderer: Renderer,
        focusSelectionBehavior: FocusSelectionBehavior,
        userInterfaceInputBehavior: UserInterfaceInputBehavior,
        scrollBehavior: ScrollBehavior,
        rowPropertiesBehavior: RowPropertiesBehavior,
        cellPropertiesBehavior: CellPropertiesBehavior,
        private readonly _eventBehavior: EventBehavior,
    ) {
        this._sharedState = {} as UiBehaviorSharedState

        this._services = new UiBehaviorServices(
            this._sharedState,
            mouse,
            canvasEx,
            selection,
            focus,
            columnsManager,
            subgridsManager,
            viewport,
            renderer,
            gridProperties,
            focusSelectionBehavior,
            userInterfaceInputBehavior,
            scrollBehavior,
            rowPropertiesBehavior,
            cellPropertiesBehavior,
            this._eventBehavior,
        );

        this.load();

        this._eventBehavior.uiMouseClickEventer = (event) => this.handleClickEvent(event);
        this._eventBehavior.uiMouseDblClickEventer = (event) => this.handleDoubleClickEvent(event);
        this._eventBehavior.uiMouseDownEventer = (event) => this.handleMouseDownEvent(event);
        this._eventBehavior.uiMouseUpEventer = (event) => this.handleMouseUpEvent(event);
        this._eventBehavior.uiMouseMoveEventer = (event) => this.handleMouseMoveEvent(event);
        this._eventBehavior.uiMouseDragEventer = (event) => this.handleMouseDragEvent(event);
        this._eventBehavior.uiMouseEnteredCellEventer = (event) => this.handleMouseEnteredCellEvent(event);
        this._eventBehavior.uiMouseExitedCellEventer = (event) => this.handleMouseExitedCellEvent(event);
        this._eventBehavior.uiWheelMoveEventer = (event) => this.handleWheelMovedEvent(event);
        this._eventBehavior.uiContextMenuEventer = (event) => this.handleContextMenuEvent(event);
    }

    load() {
        /**
         * @summary Controller chain of command.
         * @desc Each feature is linked to the next feature.
         */

        /**
         * @summary Hash of instantiated features by class names.
         * @desc Built here but otherwise not in use.
         */

        const featureNames = this.grid.properties.features;
        if (featureNames !== undefined) {
            const maxCount = featureNames.length;
            const features = new Array<UiBehavior>(maxCount);
            let count = 0;
            for (let i = 0; i < maxCount; i++) {
                const name = featureNames[i];
                const feature = UiBehaviorFactory.create(name, this.grid, this._services);
                if (feature === undefined) {
                    console.warn(`Feature not registered: ${name}`);
                } else {
                    features[count++] = feature;
                }
            }

            features.forEach(
                (feature, i) => {
                    this._uiBehaviorMap.set(feature.typeName, feature);

                    if (i > 0) {
                        this._firstUiBehavior.setNext(feature);
                    } else {
                        this._firstUiBehavior = feature;
                    }
                }
            )
        }

        if (this._firstUiBehavior) {
            this._firstUiBehavior.initializeOn();
        }

        UiBehaviorSharedState.initialise(this._sharedState);
    }

    enable() {
        if (this._firstUiBehavior !== undefined) {
            this._enabled = true;
        }
    }

    disable() {
        this._enabled = false;
    }

    lookupFeature(key: string) {
        return this._uiBehaviorMap.get(key);
    }

    /**
     * @desc delegate setting the cursor up the feature chain of responsibility
     * @internal
     */
    setCursor() {
        this.grid.updateCursor();
        this._firstUiBehavior.setCursor();
    }

    /**
     * @desc delegate handling mouse move to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handleMouseMoveEvent(event: MouseEvent): ViewportCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleMouseMove(event, undefined);
            this.setCursor();
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling tap to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handleClickEvent(event: MouseEvent): ViewportCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleClick(event, undefined);
            this.setCursor();
            this._sharedState.mouseDownUpClickUsedForMoveOrResize = false;
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling tap to the feature chain of responsibility
     * @internal
     */
    private handleContextMenuEvent(event: MouseEvent): ViewportCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleContextMenu(event, undefined);
            this.setCursor();
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling wheel moved to the feature chain of responsibility
     * @internal
     */
    private handleWheelMovedEvent(event: WheelEvent): ViewportCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleWheelMoved(event, undefined);
            this.setCursor();
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling mouse up to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handleMouseUpEvent(event: MouseEvent): ViewportCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleMouseUp(event, undefined);
            this.setCursor();
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling mouse drag to the feature chain of responsibility
     * @internal
     */
    private handleMouseDragEvent(event: MouseEvent): ViewportCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleMouseDrag(event, undefined);
            this.setCursor();
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling key down to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    onKeyDown(eventDetail: EventDetail.Keyboard) {
        if (this._enabled) {
            this._firstUiBehavior.handleKeyDown(eventDetail);
            this.setCursor();
        }
    }

    /**
     * @desc delegate handling key up to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    onKeyUp(eventDetail: EventDetail.Keyboard) {
        if (this._enabled) {
            this._firstUiBehavior.handleKeyUp(eventDetail);
            this.setCursor();
        }
    }

    /**
     * @desc delegate handling double click to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handleDoubleClickEvent(event: MouseEvent): ViewportCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleDoubleClick(event, undefined);
            this.setCursor();
            return cell;
        } else {
            return undefined;
        }
    }
    /**
     * @desc delegate handling mouse down to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    private handleMouseDownEvent(event: MouseEvent): ViewportCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleMouseDown(event, undefined);
            this.setCursor();
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling mouse exit to the feature chain of responsibility
     * @internal
     */
    private handleMouseEnteredCellEvent(event: MouseEvent): ViewportCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleMouseEnter(event, undefined);
            this.setCursor();
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc delegate handling mouse exit to the feature chain of responsibility
     * @internal
     */
    private handleMouseExitedCellEvent(event: MouseEvent): ViewportCell | null | undefined {
        if (this._enabled) {
            const cell = this._firstUiBehavior.handleMouseExit(event, undefined);
            this.setCursor();
            return cell;
        } else {
            return undefined;
        }
    }

    /**
     * @desc Delegate handling touchstart to the feature chain of responsibility.
     * @internal
     */
    onTouchStart(eventDetail: EventDetail.Touch) {
        if (this._enabled) {
            this._firstUiBehavior.handleTouchStart(eventDetail);
        }
    }

    /**
     * @desc Delegate handling touchmove to the feature chain of responsibility.
     * @internal
     */
    onTouchMove(eventDetail: EventDetail.Touch) {
        if (this._enabled) {
            this._firstUiBehavior.handleTouchMove(eventDetail);
        }
    }

    /**
     * @desc Delegate handling touchend to the feature chain of responsibility.
     * @internal
     */
    onTouchEnd(eventDetail: EventDetail.Touch) {
        if (this._enabled) {
            this._firstUiBehavior.handleTouchEnd(eventDetail);
        }
    }
}
