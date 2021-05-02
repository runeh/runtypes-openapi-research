import { AnyType, RecordType } from 'generate-runtypes';
import { OpenAPIV3 } from 'openapi-types';

export type HttpMethods = OpenAPIV3.HttpMethods;
export type OperationObject = OpenAPIV3.OperationObject;
export type ParameterObject = OpenAPIV3.ParameterObject;
export type PathItemObject = OpenAPIV3.PathItemObject;
export type ReferenceObject = OpenAPIV3.ReferenceObject;
export type RequestBodyObject = OpenAPIV3.RequestBodyObject;
export type SchemaObject = OpenAPIV3.SchemaObject;
export type ResponseObject = OpenAPIV3.ResponseObject;
export type ResponsesObject = OpenAPIV3.ResponsesObject;
export type HeaderObject = OpenAPIV3.HeaderObject;

export type ParamKind = 'query' | 'header' | 'path' | 'cookie' | 'body';

export interface Param {
  kind: ParamKind;
  name: string;
  required: boolean;
  type: AnyType;
}

export interface ApiResponse {
  default: boolean;
  status?: number;
  headers: { name: string; type: AnyType }[];
}

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

interface AllOfSchemaObject extends OpenAPIV3.NonArraySchemaObject {
  allOf: NonNullable<OpenAPIV3.NonArraySchemaObject['allOf']>;
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isAllOfSchemaObject(
  schema: SchemaObject,
): schema is AllOfSchemaObject {
  // fixme: verify if this "good" enough.
  return schema.allOf != null;
}

export function isReferenceObject(
  thing:
    | ParameterObject
    | ReferenceObject
    | RequestBodyObject
    | SchemaObject
    | HeaderObject
    | undefined,
): thing is ReferenceObject {
  return thing != null && '$ref' in thing;
}

export function isParameterObject(
  thing: ReferenceObject | ParameterObject,
): thing is ParameterObject {
  return !isReferenceObject(thing);
}

export function isSchemaObject(
  thing: ReferenceObject | SchemaObject | undefined,
): thing is SchemaObject {
  return !isReferenceObject(thing);
}

export function isRequestBodyObject(
  thing: ReferenceObject | RequestBodyObject | undefined,
): thing is RequestBodyObject {
  return !isReferenceObject(thing);
}

export function isResponseObject(
  thing: ReferenceObject | ResponseObject | undefined,
): thing is ResponseObject {
  return !isReferenceObject(thing);
}

export function isHeaderObject(
  thing: ReferenceObject | HeaderObject | undefined,
): thing is HeaderObject {
  return !isReferenceObject(thing);
}

export function getParamKind(str: string): ParamKind {
  switch (str) {
    case 'body':
    case 'cookie':
    case 'header':
    case 'path':
    case 'query':
      return str;
  }
  throw new Error(`Invalid param kind "${str}"`);
}

export function isRecordType(type: AnyType): type is RecordType {
  return type.kind === 'record';
}
