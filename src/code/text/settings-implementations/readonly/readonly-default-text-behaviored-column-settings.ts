import { readonlyBehavioredSettings } from '../../../settings-implementations/settings-implementations-public-api';
import { TextBehavioredColumnSettings } from '../../settings/text-settings-public-api';
import { defaultTextColumnSettings, defaultTextGridSettings } from '../default/text-settings-implementations-default-public-api';

/** @public */
export const readonlyDefaultTextBehavioredColumnSettings: Readonly<TextBehavioredColumnSettings> = {
    gridSettings: defaultTextGridSettings,
    ...defaultTextColumnSettings,
    ...readonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    merge: () => {},
    clone: () => { return readonlyDefaultTextBehavioredColumnSettings; }
} as const;
