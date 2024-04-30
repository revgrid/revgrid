// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { RevTextFormattableValue } from '../client/text-formattable-value';

/** @public */
export interface RevTextFormatterService<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    format(value: RevTextFormattableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>): string;
}
