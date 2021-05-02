import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { OpenAPIV3 } from 'openapi-types';
import { dereference } from 'swagger-parser';
import invariant from 'ts-invariant';
import { parse } from 'yaml';
import {
  ApiResponse,
  Operation,
  OperationObject,
  Param,
  ParameterObject,
  PathItemObject,
  getParamKind,
  isDefined,
  isParameterObject,
  isRequestBodyObject,
  isResponseObject,
  isSchemaObject,
  isHeaderObject,
} from './common';
import { schemaToType } from './type-parser';
import { AnyType } from 'generate-runtypes';

function parseParameter(param: ParameterObject): Param {
  invariant(isSchemaObject(param.schema));
  return {
    name: param.name,
    kind: getParamKind(param.in),
    type: schemaToType(param.schema),
    required: param.required ?? false,
  };
}

function parseRequestBodyParameter(body: OpenAPIV3.RequestBodyObject): Param {
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

function parseResponses(responses: OpenAPIV3.ResponsesObject): ApiResponse[] {
  return Object.entries(responses).map(([status, response]) => {
    invariant(isResponseObject(response));
    return parseResponse(response, status ? Number(status) : 'default');
  });
}

function parseHeaders(
  headers:
    | Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.HeaderObject>
    | undefined,
): { name: string; type: AnyType }[] {
  return Object.entries(headers || {})
    .map(([name, val]) => {
      return isHeaderObject(val)
        ? ({ name, type: { kind: 'never' } } as const)
        : undefined;
    })
    .filter(isDefined);
}

function parseResponse(
  response: OpenAPIV3.ResponseObject,
  status: number | 'default',
): ApiResponse {
  return {
    default: status === 'default',
    status: typeof status === 'number' ? status : undefined,
    headers: parseHeaders(response.headers),
  };
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

  const responses = parseResponses(operation.responses ?? {});

  const ret = {
    operationId,
    description,
    summary,
    deprecated: deprecated ?? false,
    params: (parameters || []).filter(isParameterObject).map(parseParameter),
    responses,
  };

  if (requestBody) {
    invariant(isRequestBodyObject(requestBody));
    const hasJson = requestBody.content['application/json'];
    if (hasJson) {
      const requestParam = parseRequestBodyParameter(requestBody);
      ret.params.push(requestParam);
    }
    // fixme: do something else here when other type
  }

  return ret;
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
  // const definitionPath = resolve(__dirname, '../resources/tripletex.json');
  const definitionPath = resolve(__dirname, '../resources/fiken.yaml');
  const raw = await readFile(definitionPath, 'utf-8');
  const parsed = await parse(raw);
  if (parsed.swagger) {
    throw new Error('Not handling swagger files yet. Only openapi 3');
  }

  const dereffed = await dereference(parsed);
  const operations = Object.entries(dereffed.paths).flatMap(([path, item]) =>
    parsePath(path, item),
  );

  console.log(JSON.stringify(operations, null, 2));
}

main();
