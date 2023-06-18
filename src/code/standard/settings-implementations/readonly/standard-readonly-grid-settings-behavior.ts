/* eslint-disable @typescript-eslint/no-empty-function */

import { readonlyGridSettingsBehavior } from '../../../settings-implementations/settings-implementations-public-api';
import { StandardGridSettingsBehavior } from '../../settings/standard-settings-public-api';

/** @public */
export const standardReadonlyGridSettingsBehavior: StandardGridSettingsBehavior = {
    ...readonlyGridSettingsBehavior,
    load: () => {},
}
