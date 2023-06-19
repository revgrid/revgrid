import { AllGridSettings } from './all-grid-settings';
import { GridSettingsBehavior } from './grid-settings-behavior';

/** @public */
export interface BehavioredGridSettings extends AllGridSettings {
    /** @internal */
    resizeEventer: GridSettingsBehavior.ResizeEventer | undefined;
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
    load(settings: AllGridSettings): void;
    clone(): BehavioredGridSettings;

    subscribeChangedEvent(handler: GridSettingsBehavior.ChangedEventHandler): void;
    unsubscribeChangedEvent(handler: GridSettingsBehavior.ChangedEventHandler): void;
}
