import { Behavior } from '../behavior/behavior';
import { MouseCellEvent } from '../cell/cell-event';
import { ColumnsManager } from '../column/columns-manager';
import { EventDetail } from '../event/event-detail';
import { Focus } from '../focus';
import { GridProperties } from '../grid-properties';
import { Renderer } from '../renderer/renderer';
import { Revgrid } from '../revgrid';
import { Selection } from '../selection/selection';
import { SubgridsManager } from '../subgrid/subgrids-manager';
import { Feature } from './feature';
import { FeatureFactory } from './feature-factory';
import { FeatureServices } from './feature-services';
import { FeaturesSharedState } from './features-shared-state';

/** @internal */
export class FeaturesManager {
    private _featureMap = new Map<string, Feature>();
    private _firstFeature: Feature;
    private _enabled = false;

    readonly _sharedState: FeaturesSharedState; // Will be initialised in constructor
    readonly _services: FeatureServices;

    constructor(
        private readonly _behavior: Behavior,
        private readonly grid: Revgrid, // remove in future
        gridProperties: GridProperties,
        focus: Focus,
        selection: Selection,
        columnsManager: ColumnsManager,
        subgridsManager: SubgridsManager,
        renderer: Renderer,
    ) {
        this._sharedState = {} as FeaturesSharedState

        this._services = new FeatureServices(
            this._sharedState,
            selection,
            focus,
            columnsManager,
            subgridsManager,
            renderer,
            gridProperties,
        );
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
            const features = new Array<Feature>(maxCount);
            let count = 0;
            for (let i = 0; i < maxCount; i++) {
                const name = featureNames[i];
                const feature = FeatureFactory.create(name, this._behavior, this.grid, this._services);
                if (feature === undefined) {
                    console.warn(`Feature not registered: ${name}`);
                } else {
                    features[count++] = feature;
                }
            }

            features.forEach(
                (feature, i) => {
                    this._featureMap.set(feature.typeName, feature);

                    if (i > 0) {
                        this._firstFeature.setNext(feature);
                    } else {
                        this._firstFeature = feature;
                    }
                }
            )
        }

        if (this._firstFeature) {
            this._firstFeature.initializeOn();
        }

        FeaturesSharedState.initialise(this._sharedState);
    }

    enable() {
        if (this._firstFeature !== undefined) {
            this._enabled = true;
        }
    }

    disable() {
        this._enabled = false;
    }

    lookupFeature(key: string) {
        return this._featureMap.get(key);
    }

    /**
     * @desc delegate setting the cursor up the feature chain of responsibility
     * @internal
     */
    setCursor() {
        this.grid.updateCursor();
        this._firstFeature.setCursor();
    }

    /**
     * @desc delegate handling mouse move to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    onMouseMove(event: MouseCellEvent | undefined) {
        if (this._enabled) {
            this._firstFeature.handleMouseMove(event);
            this.setCursor();
        }
    }

    /**
     * @desc delegate handling tap to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    onClick(event: MouseCellEvent) {
        if (this._enabled) {
            this._firstFeature.handleClick(event);
            this.setCursor();
            this._sharedState.mouseDownUpClickUsedForMoveOrResize = false;
        }
    }

    /**
     * @desc delegate handling tap to the feature chain of responsibility
     * @internal
     */
    onContextMenu(event: MouseCellEvent) {
        if (this._enabled) {
            this._firstFeature.handleContextMenu(event);
            this.setCursor();
        }
    }

    /**
     * @desc delegate handling wheel moved to the feature chain of responsibility
     * @internal
     */
    onWheelMoved(event: MouseCellEvent) {
        if (this._enabled) {
            this._firstFeature.handleWheelMoved(event);
            this.setCursor();
        }
    }

    /**
     * @desc delegate handling mouse up to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    onMouseUp(event: MouseCellEvent) {
        if (this._enabled) {
            this._firstFeature.handleMouseUp(event);
            this.setCursor();
        }
    }

    /**
     * @desc delegate handling mouse drag to the feature chain of responsibility
     * @internal
     */
    onMouseDrag(event: MouseCellEvent) {
        if (this._enabled) {
            this._firstFeature.handleMouseDrag(event);
            this.setCursor();
        }
    }

    /**
     * @desc delegate handling key down to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    onKeyDown(eventDetail: EventDetail.Keyboard) {
        if (this._enabled) {
            this._firstFeature.handleKeyDown(eventDetail);
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
            this._firstFeature.handleKeyUp(eventDetail);
            this.setCursor();
        }
    }

    /**
     * @desc delegate handling double click to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    onDoubleClick(event: MouseCellEvent) {
        if (this._enabled) {
            this._firstFeature.handleDoubleClick(event);
            this.setCursor();
        }
    }
    /**
     * @desc delegate handling mouse down to the feature chain of responsibility
     * @param event - the event details
     * @internal
     */
    handleMouseDown(event: MouseCellEvent) {
        if (this._enabled) {
            this._firstFeature.handleMouseDown(event);
            this.setCursor();
        }
    }

    /**
     * @desc delegate handling mouse exit to the feature chain of responsibility
     * @internal
     */
    handleMouseExit(event: MouseCellEvent) {
        if (this._enabled) {
            this._firstFeature.handleMouseExit(event);
            this.setCursor();
        }
    }

    /**
     * @desc Delegate handling touchstart to the feature chain of responsibility.
     * @internal
     */
    onTouchStart(eventDetail: EventDetail.Touch) {
        if (this._enabled) {
            this._firstFeature.handleTouchStart(eventDetail);
        }
    }

    /**
     * @desc Delegate handling touchmove to the feature chain of responsibility.
     * @internal
     */
    onTouchMove(eventDetail: EventDetail.Touch) {
        if (this._enabled) {
            this._firstFeature.handleTouchMove(eventDetail);
        }
    }

    /**
     * @desc Delegate handling touchend to the feature chain of responsibility.
     * @internal
     */
    onTouchEnd(eventDetail: EventDetail.Touch) {
        if (this._enabled) {
            this._firstFeature.handleTouchEnd(eventDetail);
        }
    }
}
