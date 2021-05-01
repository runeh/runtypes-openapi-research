import { resolve } from 'path';
import { OpenAPIV3 } from 'openapi-types';
import { dereference } from 'swagger-parser';
import { schemaToType } from './type-parser';
import invariant from 'ts-invariant';

type PathItemObject = OpenAPIV3.PathItemObject;
type OperationObject = OpenAPIV3.OperationObject;

const definitionPath = resolve(__dirname, '../resources/fiken.yaml');

// function parseOperation(op: OperationObject) {
//   const {
//     deprecated,
//     description,
//     operationId,
//     parameters,
//     summary,
//     requestBody,
//   } = op;
// }

function parsePath(item: PathItemObject) {
  if (item.get) {
    // parseOperation(item.get);
  }
}

interface Param {
  name: string;
  location: 'query' | 'path';
  deprecated?: boolean;
}

// function parseParameters(params: OpenAPIV3.ParameterObject) {

// }

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

async function main() {
  const v4 = await dereference(definitionPath);

  for (const [_path, val] of Object.entries(v4.paths)) {
    const item: PathItemObject = val;
    if (item.parameters) {
      invariant(item.parameters.every(isParam), 'not every');
      const params = item.parameters.map((e) => {
        invariant(isSchemaObject(e.schema), 'not schema');
        // invariant
        return {
          name: e.name,
          kind: getParamKind(e.in),
          types: schemaToType(e.schema),
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
