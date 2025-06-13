import { RevBehavioredSettings, RevGridSettingChangeInvalidateType, RevGridSettingChangeInvalidateTypeId } from '../../client/internal-api';
import { RevAssertError, RevUnreachableCaseError } from '../../common/internal-api';

/** @public */
export abstract class RevInMemoryBehavioredSettings implements RevBehavioredSettings {
    /** @internal */
    viewRenderInvalidatedEventer: RevBehavioredSettings.ViewRenderInvalidatedEventer | undefined;
    /** @internal */
    viewLayoutInvalidatedEventer: RevBehavioredSettings.ViewLayoutInvalidatedEventer | undefined;
    /** @internal */
    horizontalViewLayoutInvalidatedEventer: RevBehavioredSettings.ViewLayoutInvalidatedEventer | undefined;
    /** @internal */
    verticalViewLayoutInvalidatedEventer: RevBehavioredSettings.ViewLayoutInvalidatedEventer | undefined;
    /** @internal */
    resizeEventer: RevBehavioredSettings.ResizeEventer | undefined;

    /** @internal */
    private _beginChangeCount = 0;
    /** @internal */
    private _highestPriorityInvalidateType: RevGridSettingChangeInvalidateTypeId | undefined;
    /** @internal */
    private _changedEventHandlers =  new Array<RevBehavioredSettings.ChangedEventHandler>();


    beginChange() {
        if (this._beginChangeCount++ === 0) {
            this._highestPriorityInvalidateType = undefined;
        }
    }

    endChange(): boolean {
        const beginChangeInvalidateType = this._highestPriorityInvalidateType;
        const changed = beginChangeInvalidateType !== undefined;
        if (--this._beginChangeCount === 0) {
            if (changed) {
                this.notifyChanged(beginChangeInvalidateType);
                this._highestPriorityInvalidateType = undefined;
            }
        } else {
            if (this._beginChangeCount < 0) {
                throw new RevAssertError('IMDBSEC65997');
            }
        }
        return changed;
    }

    subscribeChangedEvent(handler: RevBehavioredSettings.ChangedEventHandler) {
        this._changedEventHandlers.push(handler);
    }

    unsubscribeChangedEvent(handler: RevBehavioredSettings.ChangedEventHandler) {
        const index = this._changedEventHandlers.indexOf(handler);
        if (index < 0) {
            throw new RevAssertError('IMBSUCE23445');
        } else {
            this._changedEventHandlers.splice(index, 1);
        }
    }

    protected flagChangedViewRender() {
        this.flagChanged(RevGridSettingChangeInvalidateTypeId.ViewRender);
    }

    protected flagChanged(invalidateType: RevGridSettingChangeInvalidateTypeId) {
        if (this._highestPriorityInvalidateType === undefined) {
            this._highestPriorityInvalidateType = invalidateType;
        } else {
            this._highestPriorityInvalidateType = RevGridSettingChangeInvalidateType.getHigherPriority(invalidateType, this._highestPriorityInvalidateType);
        }
    }

    private notifyChanged(invalidateType: RevGridSettingChangeInvalidateTypeId) {
        for (const handler of this._changedEventHandlers) {
            handler();
        }

        switch (invalidateType) {
            case RevGridSettingChangeInvalidateTypeId.None:
                break;
            case RevGridSettingChangeInvalidateTypeId.ViewRender:
                if (this.viewRenderInvalidatedEventer !== undefined) {
                    this.viewRenderInvalidatedEventer();
                }
                break;
            case RevGridSettingChangeInvalidateTypeId.HorizontalViewLayout:
                if (this.horizontalViewLayoutInvalidatedEventer !== undefined) {
                    this.horizontalViewLayoutInvalidatedEventer(false);
                }
                break;
            case RevGridSettingChangeInvalidateTypeId.VerticalViewLayout:
                if (this.verticalViewLayoutInvalidatedEventer !== undefined) {
                    this.verticalViewLayoutInvalidatedEventer(false);
                }
                break;
            case RevGridSettingChangeInvalidateTypeId.ViewLayout:
                if (this.viewLayoutInvalidatedEventer !== undefined) {
                    this.viewLayoutInvalidatedEventer(false);
                }
                break;
            case RevGridSettingChangeInvalidateTypeId.HorizontalViewLayoutAndScrollDimension:
                if (this.horizontalViewLayoutInvalidatedEventer !== undefined) {
                    this.horizontalViewLayoutInvalidatedEventer(true);
                }
                break;
            case RevGridSettingChangeInvalidateTypeId.VerticalViewLayoutAndScrollDimension:
                if (this.verticalViewLayoutInvalidatedEventer !== undefined) {
                    this.verticalViewLayoutInvalidatedEventer(true);
                }
                break;
            case RevGridSettingChangeInvalidateTypeId.ViewLayoutAndScrollDimension:
                if (this.viewLayoutInvalidatedEventer !== undefined) {
                    this.viewLayoutInvalidatedEventer(true);
                }
                break;
            case RevGridSettingChangeInvalidateTypeId.Resize:
                if (this.resizeEventer !== undefined) {
                    this.resizeEventer();
                }
                break;
            default:
                throw new RevUnreachableCaseError('IMDMGSIBT43332', invalidateType);
        }
    }
}
