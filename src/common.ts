import { AnyType, RecordType } from 'generate-runtypes';
import { HttpMethods } from './parsers/openapi3/common';

export type ParamKind = 'query' | 'header' | 'path' | 'cookie' | 'body';

export interface Param {
  kind: ParamKind;
  name: string;
  required: boolean;
  type: AnyType;
}

export interface ReferenceParam extends Param {
  ref: string;
  typeName: string;
}

export interface Schema {
  name: string;
  ref: string;
  type: AnyType;
  typeName: string;
}

export interface ApiResponse {
  default: boolean;
  status?: number;
  headers: { name: string; type: AnyType }[];
  bodyAlternatives: { mimeType: string; type: AnyType }[];
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

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
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
