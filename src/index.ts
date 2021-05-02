import { resolve } from 'path';
import { AnyType } from 'generate-runtypes';
import { OpenAPIV3 } from 'openapi-types';
import { dereference } from 'swagger-parser';
import invariant from 'ts-invariant';
import { schemaToType } from './type-parser';

const definitionPath = resolve(__dirname, '../resources/fiken.yaml');

type HttpMethods = OpenAPIV3.HttpMethods;
type OperationObject = OpenAPIV3.OperationObject;
type ParameterObject = OpenAPIV3.ParameterObject;
type PathItemObject = OpenAPIV3.PathItemObject;
type ReferenceObject = OpenAPIV3.ReferenceObject;
type SchemaObject = OpenAPIV3.SchemaObject;

type ParamKind = 'query' | 'header' | 'path' | 'cookie' | 'body';

interface Param {
  kind: ParamKind;
  name: string;
  required: boolean;
  type: AnyType;
}

interface Operation {
  operationId: string;
  method: HttpMethods;
  path: string;
  deprecated: boolean;
  params: Param[];
  description?: string;
  summary?: string;
}

function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

function isParameterObject(
  thing: ReferenceObject | ParameterObject,
): thing is ParameterObject {
  return !('$ref' in thing);
}

function isSchemaObject(
  thing: ReferenceObject | SchemaObject | undefined,
): thing is SchemaObject {
  return thing != null && !('$ref' in thing);
}

function getParamKind(str: string): ParamKind {
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

function parseParameter(param: ParameterObject): Param {
  invariant(isSchemaObject(param.schema));
  return {
    name: param.name,
    kind: getParamKind(param.in),
    type: schemaToType(param.schema),
    required: param.required ?? false,
  };
}

function parseOperation(
  operation: OperationObject,
): Omit<Operation, 'method' | 'path'> {
  const {
    operationId,
    description,
    deprecated,
    parameters,
    summary,
  } = operation;

  invariant(operationId);

  return {
    operationId,
    description,
    summary,
    deprecated: deprecated ?? false,
    params: (parameters || []).filter(isParameterObject).map(parseParameter),
  };
}

function parsePath(path: string, item: PathItemObject): Operation[] {
  const paramsForPath = (item.parameters ?? [])
    .filter(isParameterObject)
    .map(parseParameter);

  const operations = Object.values(OpenAPIV3.HttpMethods)
    .map<Operation | undefined>((method) => {
      const operation = item[method];
      if (operation) {
        const op = parseOperation(operation);
        return {
          ...op,
          path,
          method,
          params: [...op.params, ...paramsForPath],
        };
      } else {
        return undefined;
      }
    })
    .filter(isDefined);

  return operations;
}

async function main() {
  const v4 = await dereference(definitionPath);

  const pathMethods = Object.entries(v4.paths).flatMap(([path, item]) =>
    parsePath(path, item),
  );

  const first = pathMethods[1];

  console.log(JSON.stringify(first, null, 2));
}

main();
