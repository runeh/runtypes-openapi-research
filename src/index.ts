import { resolve } from 'path';
import { OpenAPIV3 } from 'openapi-types';
import { dereference } from 'swagger-parser';
import invariant from 'ts-invariant';
import { schemaToType } from './type-parser';

const definitionPath = resolve(__dirname, '../resources/fiken.yaml');

type HttpMethod =
  | 'get'
  | 'put'
  | 'post'
  | 'delete'
  | 'options'
  | 'head'
  | 'patch'
  | 'trace';

// function parseParameters(params: OpenAPIV3.ParameterObject) {

// }

function isDefined<T>(value: T | undefined | null): value is T {
  return typeof value !== 'undefined' && value !== null;
}

function isParam(
  thing: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject,
): thing is OpenAPIV3.ParameterObject {
  return !('$ref' in thing);
}

function isSchemaObject(
  thing: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject | undefined,
): thing is OpenAPIV3.SchemaObject {
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
  method: OpenAPIV3.HttpMethods,
  operation: OpenAPIV3.OperationObject,
): { method: OpenAPIV3.HttpMethods; operation: any } {
  return { method, operation };
}

function parsePath(path: string, item: OpenAPIV3.PathItemObject) {
  const paramsForPath = item.parameters?.filter(isParam).map((e) => {
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
    const item: OpenAPIV3.PathItemObject = val;
    if (item.parameters) {
      invariant(item.parameters.every(isParam), 'not every');
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

  // const pth = '/companies/{companySlug}/projects';
  // const things = JSON.stringify(v4.paths, null, 2);
  // console.log(things);
}

main();
