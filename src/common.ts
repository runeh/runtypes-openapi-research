import { resolve } from 'path';
import { AnyType } from 'generate-runtypes';
import { OpenAPIV3 } from 'openapi-types';

export type HttpMethods = OpenAPIV3.HttpMethods;
export type OperationObject = OpenAPIV3.OperationObject;
export type ParameterObject = OpenAPIV3.ParameterObject;
export type PathItemObject = OpenAPIV3.PathItemObject;
export type ReferenceObject = OpenAPIV3.ReferenceObject;
export type RequestBodyObject = OpenAPIV3.RequestBodyObject;
export type SchemaObject = OpenAPIV3.SchemaObject;

export type ParamKind = 'query' | 'header' | 'path' | 'cookie' | 'body';

export interface Param {
  kind: ParamKind;
  name: string;
  required: boolean;
  type: AnyType;
}

export interface Operation {
  operationId: string;
  method: HttpMethods;
  path: string;
  deprecated: boolean;
  params: Param[];
  description?: string;
  summary?: string;
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function isReferenceObject(
  thing:
    | ParameterObject
    | ReferenceObject
    | RequestBodyObject
    | SchemaObject
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
