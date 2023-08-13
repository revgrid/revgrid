import { ModifierKey } from '../../types-utils/modifier-key';
import { SelectionAreaTypeSpecifier } from '../../types-utils/types';
import { deepExtendValue } from '../../types-utils/utils';
import { OnlyGridSettings } from './only-grid-settings';

/** @public */
export type GridSettings = OnlyGridSettings;

/** @public */
export namespace GridSettings {
    export type Color = OnlyGridSettings.Color;

    export function assign(source: Partial<GridSettings>, target: GridSettings): boolean {
        const sourceKeys = Object.keys(source) as (keyof GridSettings)[];
        if (sourceKeys.length === 0) {
            return false;
        } else {
            for (const key of sourceKeys) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    const typedValue = source[key];
                    const value = deepExtendValue({}, typedValue);
                    (target[key] as unknown) = value;
                }
            }
            return true;
        }
    }

    export function isAddToggleSelectionAreaModifierKeyDownInEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: GridSettings, event: T) {
        return ModifierKey.isDownInEvent(gridSettings.addToggleSelectionAreaModifierKey, event);
    }

    export function isExtendLastSelectionAreaModifierKeyDownInEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: GridSettings, event: T) {
        return ModifierKey.isDownInEvent(gridSettings.extendLastSelectionAreaModifierKey, event);
    }

    export function isSecondarySelectionAreaTypeSpecifierModifierKeyDownInEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: GridSettings, event: T) {
        return ModifierKey.isDownInEvent(gridSettings.secondarySelectionAreaTypeSpecifierModifierKey, event);
    }

    export function isShowScrollerThumbOnMouseMoveModifierKeyDownInEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: GridSettings, event: T) {
        return ModifierKey.isDownInEvent(gridSettings.showScrollerThumbOnMouseMoveModifierKey, event);
    }

    export function getSelectionAreaTypeFromEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: GridSettings, event: T) {
        if (ModifierKey.isDownInEvent(gridSettings.secondarySelectionAreaTypeSpecifierModifierKey, event)) {
            return gridSettings.secondarySelectionAreaType;
        } else {
            return gridSettings.primarySelectionAreaType;
        }
    }

    export function getSelectionAreaTypeSpecifierFromEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: GridSettings, event: T) {
        if (GridSettings.isSecondarySelectionAreaTypeSpecifierModifierKeyDownInEvent(gridSettings, event)) {
            return SelectionAreaTypeSpecifier.Secondary;
        } else {
            return SelectionAreaTypeSpecifier.Primary;
        }
    }
}
