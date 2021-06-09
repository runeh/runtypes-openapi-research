import { AnyType, NamedType } from 'generate-runtypes';
import { OpenAPI, OpenAPIV2, OpenAPIV3 } from 'openapi-types';
import { prop, uniqBy } from 'ramda';

type HttpMethods = OpenAPIV3.HttpMethods;

/**
 * The different values of the `in` field of parameters in OAPI 2 and 3
 */
export type ParamKind =
  | 'body'
  | 'cookie'
  | 'file'
  | 'formData'
  | 'header'
  | 'path'
  | 'query';

/**
 * Describes a type that referenced by a `$ref` in OAPI. These will generally
 * end up as named types in output.
 */
export interface ReferenceType {
  ref: string;
  name: string;
  type: AnyType; // should support file here
}

// fixme: this needs content type (don't remember what this was about)
// fixme: type should also allow `file`.
export interface Param {
  in: ParamKind;
  name: string;
  required: boolean;
  type: AnyType;
  description?: string;
}

/**
 * Describes the response that can be received from an `Operation`.
 */
export interface ApiResponse {
  default: boolean;
  status?: number;
  headers: { name: string; type: AnyType }[];
  bodyAlternatives: { mimeType: string; type: AnyType }[];
}

/**
 * Describes an operation in OpenApi.
 */
export interface Operation {
  operationId: string;
  method: HttpMethods;
  path: string;
  deprecated: boolean;
  params: Param[];
  responses: ApiResponse[];
  description?: string;
  summary?: string;
}

/**
 * Describes all the parsed contents of an API. This is what code generators
 * should consume when generating clients.
 */
export interface ApiData {
  referenceTypes: ReferenceType[];
  operations: Operation[];
}

/**
 * Type predicate to filter out null and undefined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Get a type kind of a parameter, as they are represented as string in the
 * OpenApi TS.
 */
export function getParamKind(str: string): ParamKind {
  switch (str) {
    case 'body':
    case 'cookie':
    case 'file':
    case 'formData':
    case 'header':
    case 'path':
    case 'query':
      return str;
  }
  throw new Error(`Invalid param kind "${str}"`);
}

/**
 * Get a list of all named named types references in a type and it's children
 */
export function getNamedTypes(t: AnyType): NamedType[] {
  switch (t.kind) {
    case 'boolean':
    case 'function':
    case 'literal':
    case 'never':
    case 'null':
    case 'number':
    case 'string':
    case 'symbol':
    case 'undefined':
    case 'unknown':
      return [];
    case 'named':
      return [t];
    case 'array':
      return uniqBy(prop('name'), getNamedTypes(t.type));
    case 'dictionary':
      return uniqBy(prop('name'), getNamedTypes(t.valueType));
    case 'intersect':
      return uniqBy(prop('name'), t.types.flatMap(getNamedTypes));
    case 'record':
      return uniqBy(
        prop('name'),
        t.fields.map(prop('type')).flatMap(getNamedTypes),
      );
    case 'union':
      return uniqBy(prop('name'), t.types.flatMap(getNamedTypes));
  }
}

export function isOpenApi2<T = {}>(
  doc: OpenAPI.Document<T>,
): doc is OpenAPIV2.Document<T> {
  return 'swagger' in doc;
}

export function isOpenApi3<T = {}>(
  doc: OpenAPI.Document<T>,
): doc is OpenAPIV3.Document<T> {
  return !isOpenApi2(doc);
}
