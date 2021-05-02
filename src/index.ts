import { resolve } from 'path';
import { OpenAPIV3 } from 'openapi-types';
import { dereference } from 'swagger-parser';
import invariant from 'ts-invariant';
import {
  Operation,
  OperationObject,
  Param,
  ParameterObject,
  PathItemObject,
  getParamKind,
  isDefined,
  isParameterObject,
  isRequestBodyObject,
  isSchemaObject,
} from './common';
import { schemaToType } from './type-parser';

const definitionPath = resolve(__dirname, '../resources/fiken.yaml');

function parseParameter(param: ParameterObject): Param {
  invariant(isSchemaObject(param.schema));
  return {
    name: param.name,
    kind: getParamKind(param.in),
    type: schemaToType(param.schema),
    required: param.required ?? false,
  };
}

function parseRequstBodyParameter(body: OpenAPIV3.RequestBodyObject): Param {
  const jsonBody = body.content['application/json'];

  invariant(jsonBody, 'Can only deal with json body for now');
  invariant(jsonBody.schema, 'Jsonbody is missing.schema');
  invariant(isSchemaObject(jsonBody.schema));

  const type = schemaToType(jsonBody.schema);

  const ret: Param = {
    name: 'requestBody',
    kind: 'body',
    required: body.required ?? false,
    // fixme: description
    type,
  };

  return ret;
}

function parseOperation(
  operation: OperationObject,
): Omit<Operation, 'method' | 'path'> {
  const {
    deprecated,
    description,
    operationId,
    parameters,
    requestBody,
    summary,
  } = operation;

  invariant(operationId);

  if (requestBody) {
    invariant(isRequestBodyObject(requestBody));
    const hasJson = requestBody.content['application/json'];
    if (hasJson) {
      const lal = parseRequstBodyParameter(requestBody);
    }
  }

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
          path,
          method,
          ...op,
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

  const operations = Object.entries(v4.paths).flatMap(([path, item]) =>
    parsePath(path, item),
  );

  console.log(JSON.stringify(operations, null, 2));
}

main();
