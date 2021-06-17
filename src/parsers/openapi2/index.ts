import { AnyType, LiteralType, RecordField } from 'generate-runtypes';
import { OpenAPIV2 } from 'openapi-types';
import { propEq } from 'ramda';
import { bundle } from 'swagger-parser';
import invariant from 'ts-invariant';
import {
  ApiData,
  ApiResponse,
  Operation,
  Param,
  ParamKind,
  ReferenceType,
  getParamKind,
  isDefined,
  isOpenApi2,
} from '../../common';
import { camelCase } from 'camel-case';

/**
 * Parse a "string" schema type. Strings are either strings or
 * a list of string literals
 * fixme: any other variants?
 * @param t
 * @returns
 */
function parseString(t: OpenAPIV2.SchemaObject): AnyType {
  invariant(t.type === 'string', 'should be string');

  if (t.enum) {
    return {
      kind: 'union',
      types: t.enum.map<LiteralType>((e) => ({ kind: 'literal', value: e })),
    };
  } else {
    return { kind: 'string' };
  }
}

function parseObject(t: OpenAPIV2.SchemaObject): AnyType {
  invariant(t.type === 'object', 'must be object');
  if (t.properties == null) {
    // empty object, so just do a generic string,unknown map
    return { kind: 'dictionary', valueType: { kind: 'unknown' } };
  }

  const fields = Object.entries(t.properties ?? {}).map<RecordField>(
    ([name, value]) => {
      return {
        name,
        readonly: value.readOnly,
        nullable: !value.required,
        type: schemaToType(value),
      };
    },
  );

  return { kind: 'record', fields };
}

export function refToName(ref: OpenAPIV2.ReferenceObject): string {
  const match = /#\/definitions\/(.*)$/.exec(ref.$ref);
  invariant(match != null, `Couldn't parse ref name "${ref}"`);
  const [, name] = match;
  return name;
}

function isReferenceObject(
  thing: OpenAPIV2.SchemaObject | OpenAPIV2.ItemsObject,
): thing is OpenAPIV2.ReferenceObject {
  return '$ref' in thing;
}

function isNotReferenceObject<T>(
  thing: T,
): thing is Exclude<T, OpenAPIV2.ReferenceObject> {
  return !thing || !('$ref' in thing);
}

export function schemaToType(
  t: OpenAPIV2.SchemaObject | OpenAPIV2.ItemsObject,
): AnyType {
  if (isReferenceObject(t)) {
    return { kind: 'named', name: refToName(t) };
  }

  if (Object.keys(t).length === 0) {
    return { kind: 'unknown' };
  }

  switch (t.type) {
    // fixme: check spec for difference
    case 'number':
    case 'double':
    case 'integer':
      return { kind: 'number' };

    // fixme: more parsing on dates?
    case 'date':
    case 'dateTime':
      return { kind: 'string' };

    case 'boolean':
      return { kind: 'boolean' };

    case 'string':
      return parseString(t);

    case 'array': {
      invariant(t.items, 'are items?');
      return { kind: 'array', type: schemaToType(t.items) };
    }

    case 'object':
      return parseObject(t);

    // fixme: need to deal with this somewhere else
    case 'file':
      return { kind: 'unknown' };
  }

  // there's an items prop, but no "array" as type. Assume it's an array
  // I guess.
  if (t.items) {
    return { kind: 'array', type: schemaToType(t.items) };
  }

  // fixme: do things with oneOf / allOf etc
  throw new Error(`Unable to parse thing of type "${t.type}"`);
}

function getDefinitions(doc: OpenAPIV2.Document): ReferenceType[] {
  return Object.entries(doc.definitions ?? {}).map<ReferenceType>(
    ([name, def]) => {
      return {
        name,
        typeName: name,
        description: def.description,
        ref: name,
        type: schemaToType(def),
      };
    },
  );
}

interface ReferenceParam extends ReferenceType {
  in: ParamKind;
  required: boolean;
  description?: string;
}

function getOperations(
  doc: OpenAPIV2.Document,
  parameterRefs: ReferenceParam[],
) {
  return Object.entries(doc.paths).flatMap(([path, item]) => {
    invariant(item != null, 'Must be a thing');
    return parsePath(parameterRefs, path, item);
  });
}

function parsePath(
  parameterRefs: ReferenceParam[],
  path: string,
  item: OpenAPIV2.PathItemObject,
): Operation[] {
  const paramsForPath = (item.parameters ?? []).map((e) =>
    parseParameter(parameterRefs, e),
  );

  const operations = Object.values(OpenAPIV2.HttpMethods)
    .map<Operation | undefined>((method) => {
      const operation = item[method];
      if (operation) {
        const op = parseOperation(path, method, parameterRefs, operation);
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

function inferOperationId(path: string, method: string): string {
  return camelCase([...path.split('/'), method].join(' '));
}

function parseOperation(
  path: string,
  method: string,
  parameterRefs: ReferenceParam[],
  operation: OpenAPIV2.OperationObject,
): Omit<Operation, 'method' | 'path'> {
  const {
    deprecated,
    description,

    parameters,
    // consumes,
    summary,
    responses,
  } = operation;

  const operationId = operation.operationId ?? inferOperationId(path, method);

  invariant(operationId, 'op id missing');

  const ret = {
    operationId,
    description,
    summary,
    deprecated: deprecated ?? false,
    params: parameters?.map((e) => parseParameter(parameterRefs, e)) ?? [],
    responses: parseResponses(responses),
  };

  // if (fileBody) {
  //   // invariant(isNotReferenceObject(fileBody), "Can't be reference here");
  //   // fileBody.
  //   const hasJson = fileBody.content['application/json'];
  //   if (hasJson) {
  //     const requestParam = parseRequestBodyParameter(fileBody);
  //     ret.params.push(requestParam);
  //   }
  //   // fixme: do something else here when other type
  // }

  return ret;
}

function parseParameter(
  parameterRefs: ReferenceParam[],
  param: OpenAPIV2.Parameter | OpenAPIV2.ReferenceObject,
): Param {
  if (isNotReferenceObject(param)) {
    return {
      name: param.name,
      in: getParamKind(param.in),
      type: schemaToType(param.schema ?? param),
      required: param.required ?? false,
      description: param.description,
    };
  } else {
    const existingParam = parameterRefs.find(propEq('ref', param.$ref));
    invariant(existingParam != null);
    return existingParam;
  }
}

function isResponseObject(thing: unknown): thing is OpenAPIV2.ResponseObject {
  // fixme: what this is, is usually an object with a ref in the definitions
  // I've tested with.
  return typeof thing === 'object' && thing != null; // && 'description' in thing;
}

function parseResponses(responses: OpenAPIV2.ResponsesObject): ApiResponse[] {
  return Object.entries(responses).map(([key, val]) => {
    if (isResponseObject(val)) {
      return parseResponse(val, key);
    } else {
      throw new Error('halp');
    }
  });
}

function parseResponse(
  response: OpenAPIV2.ResponseObject,
  status: string | 'default',
): ApiResponse {
  return {
    default: status === 'default',
    status: isNaN(Number(status)) ? undefined : Number(status),
    headers: parseHeaders(response.headers),
    bodyAlternatives: [parseBody(response)],
  };
}

function parseHeaders(
  headers:
    | Record<string, OpenAPIV2.ReferenceObject | OpenAPIV2.HeaderObject>
    | undefined,
): { name: string; type: AnyType }[] {
  return Object.entries(headers ?? {})
    .map(([name, val]) => {
      return isNotReferenceObject(val)
        ? ({ name, type: { kind: 'never' } } as const) // fixme: use schema here
        : undefined;
    })
    .filter(isDefined);
}

// fixme: the thing here can be a ref, a schema ref (are those the same?) or
// a response object
function parseBody(body: OpenAPIV2.Response): {
  mimeType: string;
  type: AnyType;
} {
  if (isNotReferenceObject(body) && body.schema) {
    // fixme: empty schema object. is that allowed? What is the type?
    if (Object.keys(body.schema).length === 0) {
      return { mimeType: '', type: { kind: 'never' } };
    }
    return { mimeType: 'application/json', type: schemaToType(body.schema) };
  } else {
    // fixme: deal with reference types here too!
    return { mimeType: '', type: { kind: 'never' } };
  }
}

export async function parseOpenApi2(doc: OpenAPIV2.Document): Promise<ApiData> {
  const bundledDoc = await bundle(doc, { dereference: { circular: false } });
  invariant(isOpenApi2(bundledDoc));

  // need to do a `getParameters the same way as defs here.
  const definitions = getDefinitions(bundledDoc);
  const operations = getOperations(bundledDoc, []);

  return { referenceTypes: definitions, operations };
}
