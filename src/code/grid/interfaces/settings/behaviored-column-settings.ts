import { AllColumnSettings } from './all-column-settings';
import { BehavioredGridSettings } from './behaviored-grid-settings';

/** @public */
export interface BehavioredColumnSettings extends AllColumnSettings {
    readonly gridSettings: BehavioredGridSettings;

    /** @internal */
    resizeEventer: BehavioredGridSettings.ResizeEventer | undefined;
    /** @internal */
    viewRenderInvalidatedEventer: GridSettingsBehavior.ViewRenderInvalidatedEventer | undefined;
    /** @internal */
    viewLayoutInvalidatedEventer: GridSettingsBehavior.ViewLayoutInvalidatedEventer | undefined;
    /** @internal */
    horizontalViewLayoutInvalidatedEventer: GridSettingsBehavior.ViewLayoutInvalidatedEventer | undefined;
    /** @internal */
    verticalViewLayoutInvalidatedEventer: GridSettingsBehavior.ViewLayoutInvalidatedEventer | undefined;

    beginChange(): void;
    endChange(): void;
    load(settings: AllColumnSettings): void;
    clone(): BehavioredColumnSettings;

    subscribeChangedEvent(handler: GridSettingsBehavior.ChangedEventHandler): void;
    unsubscribeChangedEvent(handler: GridSettingsBehavior.ChangedEventHandler): void;
}
