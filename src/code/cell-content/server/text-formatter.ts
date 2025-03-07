import { RevTextFormattableValue } from '../client/text-formattable-value';

/** @public */
export interface RevTextFormatter<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId> {
    format(value: RevTextFormattableValue<TextFormattableValueTypeId, TextFormattableValueAttributeTypeId>): string;
}
