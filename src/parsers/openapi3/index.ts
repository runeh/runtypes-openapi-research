import { AnyType } from 'generate-runtypes';
import { OpenAPIV3 } from 'openapi-types';
import { bundle } from 'swagger-parser';
import invariant from 'ts-invariant';
import {
  ApiResponse,
  Operation,
  Param,
  getParamKind,
  isDefined,
} from '../../common';
import {
  HeaderObject,
  MediaTypeObject,
  OperationObject,
  ParameterObject,
  PathItemObject,
  ReferenceObject,
  RequestBodyObject,
  ResponseObject,
  ResponsesObject,
  isHeaderObject,
  isParameterObject,
  isRequestBodyObject,
  isResponseObject,
  isSchemaObject,
} from './common';
import { schemaToType } from './type-parser';

function parseParameter(param: ParameterObject): Param {
  invariant(isSchemaObject(param.schema), 'Not schema in parseParameter');
  return {
    name: param.name,
    kind: getParamKind(param.in),
    type: schemaToType(param.schema),
    required: param.required ?? false,
  };
}

function parseRequestBodyParameter(body: RequestBodyObject): Param {
  const jsonBody = body.content['application/json'];

  invariant(jsonBody, 'Can only deal with json body for now');
  invariant(jsonBody.schema, 'Jsonbody is missing.schema');

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

function parseResponses(responses: ResponsesObject): ApiResponse[] {
  return Object.entries(responses).map(([status, response]) => {
    invariant(isResponseObject(response), 'not a response');
    return parseResponse(response, status ? Number(status) : 'default');
  });
}

function parseHeaders(
  headers: Record<string, ReferenceObject | HeaderObject> | undefined,
): { name: string; type: AnyType }[] {
  return Object.entries(headers ?? {})
    .map(([name, val]) => {
      return isHeaderObject(val)
        ? ({ name, type: { kind: 'never' } } as const) // fixme: use schema here
        : undefined;
    })
    .filter(isDefined);
}

function parseBodies(
  bodies: Record<string, MediaTypeObject> | undefined,
): { mimeType: string; type: AnyType }[] {
  return Object.entries(bodies ?? {}).map(([mimeType, val]) => {
    invariant(val.schema != null, 'not a schema');
    return { mimeType, type: schemaToType(val.schema) };
  });
}

function parseResponse(
  response: ResponseObject,
  status: number | 'default',
): ApiResponse {
  return {
    default: status === 'default',
    status: typeof status === 'number' ? status : undefined,
    headers: parseHeaders(response.headers),
    bodyAlternatives: parseBodies(response.content),
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
    invariant(isRequestBodyObject(requestBody), 'not da bod');
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

async function getComponents(doc: OpenAPIV3.Document) {
  const schemas = Object.entries(doc.components?.schemas ?? {}).map(
    ([name, schema]) => {
      invariant(isSchemaObject(schema), 'should be schema!');
      const ref = `#/components/schemas/${name}`;
      return {
        kind: 'schema',
        name,
        ref,
        runtype: schemaToType(schema),
        runtypeName: `${name}Schema`,
        schema,
      };
    },
  );

  const parameters = Object.entries(doc.components?.parameters ?? {}).map(
    ([name, rawParameter]) => {
      invariant(isParameterObject(rawParameter), 'should be parameter!');
      const p = parseParameter(rawParameter);

      const ref = `#/components/parameters/${name}`;
      return {
        kind: 'parameter',
        name,
        ref,
        type: p.type,
        runtypeName: `${name}Parameter`,
        schema: rawParameter,
      };
    },
  );

  return { schemas, parameters };
}

function getOperations(doc: OpenAPIV3.Document) {
  return Object.entries(doc.paths).flatMap(([path, item]) => {
    invariant(item != null, 'Must be a thing');
    return parsePath(path, item);
  });
}

export async function parseOpenApi3(doc: OpenAPIV3.Document) {
  const bundledDoc = await bundle(doc, { dereference: { circular: true } });
  invariant('openapi' in bundledDoc); // make sure it's an openapi3 thing

  const { parameters, schemas } = await getComponents(bundledDoc);
  const operations = getOperations(bundledDoc);
  // const dereffed = await dereference(doc);
  // const operations = Object.entries(dereffed.paths).flatMap(([path, item]) =>
  //   parsePath(path, item),
  // );
  // return operations;

  console.log(JSON.stringify({ parameters, schemas, operations }, null, 2));
}
