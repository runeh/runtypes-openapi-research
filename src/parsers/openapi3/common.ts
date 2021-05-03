import { AnyType, RecordType } from 'generate-runtypes';
import { OpenAPIV3 } from 'openapi-types';

export type HeaderObject = OpenAPIV3.HeaderObject;
export type HttpMethods = OpenAPIV3.HttpMethods;
export type MediaTypeObject = OpenAPIV3.MediaTypeObject;
export type NonArraySchemaObject = OpenAPIV3.NonArraySchemaObject;
export type OperationObject = OpenAPIV3.OperationObject;
export type ParameterObject = OpenAPIV3.ParameterObject;
export type PathItemObject = OpenAPIV3.PathItemObject;
export type ReferenceObject = OpenAPIV3.ReferenceObject;
export type RequestBodyObject = OpenAPIV3.RequestBodyObject;
export type ResponseObject = OpenAPIV3.ResponseObject;
export type ResponsesObject = OpenAPIV3.ResponsesObject;
export type SchemaObject = OpenAPIV3.SchemaObject;

interface AllOfSchemaObject extends OpenAPIV3.NonArraySchemaObject {
  allOf: NonNullable<OpenAPIV3.NonArraySchemaObject['allOf']>;
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

export function isRecordType(type: AnyType): type is RecordType {
  return type.kind === 'record';
}
