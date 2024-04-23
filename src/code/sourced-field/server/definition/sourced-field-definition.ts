// (c) 2024 Xilytix Pty Ltd / Paul Klink

import { CommaText, Err, Integer, Ok, Result, UnreachableCaseError } from '@xilytix/sysutils';
import { HorizontalAlign } from '../../../standard/internal-api';
import { RevSourcedFieldSourceDefinition } from './sourced-field-source-definition';

/** @public */
export interface RevSourcedFieldDefinition {
    readonly name: string;
    readonly sourceDefinition: RevSourcedFieldSourceDefinition,
    readonly sourcelessName: string,
    readonly defaultTextAlign: HorizontalAlign,
    readonly defaultHeading: string,
    readonly defaultWidth?: Integer,
}

/** @public */
export namespace RevSourcedFieldDefinition {
    export namespace Name {
        export function compose(sourceName: string, sourcelessName: string) {
            if (sourceName === '') {
                return sourcelessName; // for RowDataArrayGrid
            } else {
                return CommaText.from2Values(sourceName, sourcelessName);
            }
        }

        export type DecomposedArray = [sourceName: string, sourcelessName: string];

        export const enum DecomposeErrorId {
            UnexpectedCharAfterQuotedElement,
            QuotesNotClosedInLastElement,
            NotHas2Elements,
        }

        export interface DecomposeErrorIdPlusExtra {
            readonly errorId: DecomposeErrorId;
            readonly extraInfo: string;
        }

        export function tryDecompose(name: string): Result<DecomposedArray, DecomposeErrorIdPlusExtra> {
            const toResult = CommaText.tryToStringArray(name, true);
            if (toResult.isErr()) {
                const commaTextErrorIdPlusExtra = toResult.error;
                const commaTextErrorId = commaTextErrorIdPlusExtra.errorId;
                let decomposeErrorId: DecomposeErrorId;
                switch (commaTextErrorId) {
                    case CommaText.ErrorId.UnexpectedCharAfterQuotedElement:
                        decomposeErrorId = DecomposeErrorId.UnexpectedCharAfterQuotedElement;
                        break;
                    case CommaText.ErrorId.QuotesNotClosedInLastElement:
                        decomposeErrorId = DecomposeErrorId.UnexpectedCharAfterQuotedElement;
                        break;
                    default:
                        throw new UnreachableCaseError('RFDTD68843', commaTextErrorId);
                }
                const errorIdPlusExtra: DecomposeErrorIdPlusExtra = {
                    errorId: decomposeErrorId,
                    extraInfo: commaTextErrorIdPlusExtra.extraInfo,
                }
                return new Err(errorIdPlusExtra);
            } else {
                const result = toResult.value;
                if (result.length !== 2) {
                    return new Err<DecomposedArray, DecomposeErrorIdPlusExtra>({ errorId: DecomposeErrorId.NotHas2Elements, extraInfo: name });
                } else {
                    return new Ok(result as DecomposedArray);
                }
            }
        }
    }
}
