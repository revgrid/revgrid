import { readonlyBehavioredSettings } from '../../../settings-implementations/readonly/settings-implementations-readonly-public-api';
import { TextBehavioredGridSettings } from '../../settings/text-settings-public-api';
import { defaultTextGridSettings } from '../default/text-settings-implementations-default-public-api';

/** @public */
export const readonlyDefaultTextBehavioredGridSettings: Readonly<TextBehavioredGridSettings> = {
    ...defaultTextGridSettings,
    ...readonlyBehavioredSettings,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    merge: () => {},
    clone: () => { return readonlyDefaultTextBehavioredGridSettings; }
} as const;
