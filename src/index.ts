import { resolve } from 'path';
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

type ParamKind = 'query' | 'header' | 'path' | 'cookie';

function getParamKind(str: string): ParamKind {
  switch (str) {
    case 'query':
    case 'header':
    case 'path':
    case 'cookie':
      return str;
  }
  throw new Error(`Invalid param kind "${str}"`);
}

function parseMethod(
  method: HttpMethods,
  operation: OperationObject,
): { method: HttpMethods; operation: any } {
  return { method, operation };
}

function parsePath(path: string, item: PathItemObject) {
  const paramsForPath = item.parameters?.filter(isParameterObject).map((e) => {
    invariant(isSchemaObject(e.schema));
    return {
      path,
      name: e.name,
      kind: getParamKind(e.in),
      types: schemaToType(e.schema),
      required: e.required ?? false,
    };
  });

  const operations = Object.values(OpenAPIV3.HttpMethods)
    .map((e) => {
      const method = item[e];
      return method ? parseMethod(e, method) : undefined;
    })
    .filter(isDefined);

  return operations;
}

async function main() {
  const v4 = await dereference(definitionPath);

  const pathMethods = Object.entries(v4.paths).map(([path, item]) =>
    parsePath(path, item),
  );

  for (const [path, val] of Object.entries(v4.paths)) {
    const item: PathItemObject = val;
    if (item.parameters) {
      invariant(item.parameters.every(isParameterObject), 'not every');
      const params = item.parameters.map((e) => {
        invariant(isSchemaObject(e.schema), 'not schema');
        // invariant
        return {
          path,
          name: e.name,
          kind: getParamKind(e.in),
          types: schemaToType(e.schema),
          required: e.required ?? false,
        };
      });

      console.log(params);
    }
  }
}

main();
