// (c) 2024 Xilytix Pty Ltd / Paul Klink

/** @public */
export interface RevSourcedFieldCustomHeadingsService {
    tryGetFieldHeading(sourceName: string, fieldName: string): string | undefined;
}
