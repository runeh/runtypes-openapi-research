import { AnyType } from 'generate-runtypes';
import { OpenAPIV3 } from 'openapi-types';
import { bundle } from 'swagger-parser';
import invariant from 'ts-invariant';
import {
  ApiResponse,
  Operation,
  Param,
  ReferenceParam,
  Schema,
  getParamKind,
  isDefined,
  topoSort,
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

function parseParameter(
  parameterRefs: ReferenceParam[],
  param: ParameterObject | ReferenceObject,
): Param | ReferenceParam {
  if (isParameterObject(param)) {
    invariant(param.schema != null, 'wat. cant be null');
    return {
      name: param.name,
      kind: getParamKind(param.in),
      type: schemaToType(param.schema),
      required: param.required ?? false,
    };
  } else {
    const existingParam = parameterRefs.find((e) => e.ref === param.$ref);
    invariant(existingParam != null);
    return {
      kind: existingParam.kind,
      name: existingParam.name,
      required: existingParam.required,
      type: { kind: 'named', name: existingParam.typeName },
    };
  }
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
  parameterRefs: ReferenceParam[],
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
    params: (parameters || []).map((e) => parseParameter(parameterRefs, e)),
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

function parsePath(
  parameterRefs: ReferenceParam[],
  path: string,
  item: PathItemObject,
): Operation[] {
  const paramsForPath = (item.parameters ?? []).map((e) =>
    parseParameter(parameterRefs, e),
  );

  const operations = Object.values(OpenAPIV3.HttpMethods)
    .map<Operation | undefined>((method) => {
      const operation = item[method];
      if (operation) {
        const op = parseOperation(parameterRefs, operation);
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

function getParameters(doc: OpenAPIV3.Document): ReferenceParam[] {
  const parameters = Object.entries(
    doc.components?.parameters ?? {},
  ).map<ReferenceParam>(([name, rawParameter]) => {
    invariant(isParameterObject(rawParameter), 'should be parameter!');
    const p = parseParameter([], rawParameter);
    const ref = `#/components/parameters/${name}`;
    return {
      ...p,
      ref,
      typeName: `${name}Parameter`,
    };
  });

  return parameters;
}

function getSchemas(doc: OpenAPIV3.Document): Schema[] {
  return Object.entries(doc.components?.schemas ?? {}).map<Schema>(
    ([name, schema]) => {
      invariant(isSchemaObject(schema), 'should be schema!');
      const ref = `#/components/schemas/${name}`;
      return {
        name,
        ref,
        type: schemaToType(schema),
        typeName: `${name}Schema`,
      };
    },
  );
}

function getOperations(
  doc: OpenAPIV3.Document,
  parameterRefs: ReferenceParam[],
) {
  return Object.entries(doc.paths).flatMap(([path, item]) => {
    invariant(item != null, 'Must be a thing');
    return parsePath(parameterRefs, path, item);
  });
}

export interface ApiData {
  schemas: Schema[];
  parameters: ReferenceParam[];
  operations: Operation[];
}

export async function parseOpenApi3(doc: OpenAPIV3.Document): Promise<ApiData> {
  const bundledDoc = await bundle(doc, { dereference: { circular: true } });
  invariant('openapi' in bundledDoc); // make sure it's an openapi3 thing

  const schemas = getSchemas(bundledDoc);
  const parameters = getParameters(bundledDoc);
  const operations = getOperations(bundledDoc, parameters);

  return {
    parameters: topoSort(parameters),
    schemas: topoSort(schemas),
    operations,
  };
}
