import { deepExtendValue } from '@xilytix/sysutils';
import { RevModifierKey } from '../../types-utils/modifier-key';
import { RevSelectionAreaTypeSpecifier } from '../../types-utils/types';
import { RevOnlyGridSettings } from './only-grid-settings';

/** @public */
export type RevGridSettings = RevOnlyGridSettings;

/** @public */
export namespace RevGridSettings {
    export type Color = RevOnlyGridSettings.Color;

    export function assign(source: Partial<RevGridSettings>, target: RevGridSettings): boolean {
        const sourceKeys = Object.keys(source) as (keyof RevGridSettings)[];
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

    export function isAddToggleSelectionAreaModifierKeyDownInEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: RevGridSettings, event: T) {
        return RevModifierKey.isDownInEvent(gridSettings.addToggleSelectionAreaModifierKey, event);
    }

    export function isExtendLastSelectionAreaModifierKeyDownInEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: RevGridSettings, event: T) {
        return RevModifierKey.isDownInEvent(gridSettings.extendLastSelectionAreaModifierKey, event);
    }

    export function isSecondarySelectionAreaTypeSpecifierModifierKeyDownInEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: RevGridSettings, event: T) {
        return RevModifierKey.isDownInEvent(gridSettings.secondarySelectionAreaTypeSpecifierModifierKey, event);
    }

    export function isShowScrollerThumbOnMouseMoveModifierKeyDownInEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: RevGridSettings, event: T) {
        return RevModifierKey.isDownInEvent(gridSettings.showScrollerThumbOnMouseMoveModifierKey, event);
    }

    export function getSelectionAreaTypeFromEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: RevGridSettings, event: T) {
        if (RevModifierKey.isDownInEvent(gridSettings.secondarySelectionAreaTypeSpecifierModifierKey, event)) {
            return gridSettings.secondarySelectionAreaType;
        } else {
            return gridSettings.primarySelectionAreaType;
        }
    }

    export function getSelectionAreaTypeSpecifierFromEvent<T extends MouseEvent | KeyboardEvent>(gridSettings: RevGridSettings, event: T) {
        if (RevGridSettings.isSecondarySelectionAreaTypeSpecifierModifierKeyDownInEvent(gridSettings, event)) {
            return RevSelectionAreaTypeSpecifier.Secondary;
        } else {
            return RevSelectionAreaTypeSpecifier.Primary;
        }
    }
}
