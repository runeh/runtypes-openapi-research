import { AnyType, LiteralType, RecordField } from 'generate-runtypes';
import { OpenAPIV2 } from 'openapi-types';
import { propEq } from 'ramda';
import { bundle } from 'swagger-parser';
import invariant from 'ts-invariant';
import {
  ApiData,
  Operation,
  Param,
  ParamKind,
  ReferenceType,
  getParamKind,
  isDefined,
  topoSort,
} from '../../common';

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

  switch (t.type) {
    // fixme: check spec for difference
    case 'number':
    case 'integer':
      return { kind: 'number' };

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

// function getParameters(doc: OpenAPIV2.Document): ReferenceParam[] {
//   console.log(doc.parameters);

//   // const lal = doc.parameters?

//   // const parameters = Object.entries(
//   //   doc.components?.parameters ?? {},
//   // ).map<ReferenceParam>(([name, rawParameter]) => {
//   //   invariant(isParameterObject(rawParameter), 'should be parameter!');
//   //   const p = parseParameter([], rawParameter);
//   //   const ref = `#/components/parameters/${name}`;
//   //   return {
//   //     ...p,
//   //     ref,
//   //     typeName: `${name}Parameter`,
//   //   };
//   // });

//   // return parameters;

//   return [];
// }

// function getSchemas(doc: OpenAPIV2.Document): Schema[] {
//   return Object.entries(doc.components?.schemas ?? {}).map<Schema>(
//     ([name, schema]) => {
//       invariant(isSchemaObject(schema), 'should be schema!');
//       const ref = `#/components/schemas/${name}`;
//       return {
//         name,
//         ref,
//         type: schemaToType(schema),
//         typeName: `${name}Schema`,
//         description: schema.description,
//       };
//     },
//   );
// }

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
  // const paramsForPath = (item.parameters ?? []).map((e) =>
  //   parseParameter(parameterRefs, e),
  // );

  const operations = Object.values(OpenAPIV2.HttpMethods)
    .map<Operation | undefined>((method) => {
      const operation = item[method];
      if (operation) {
        const op = parseOperation(parameterRefs, operation);
        return {
          path,
          method,
          ...op,
          params: [...op.params], //fixme:...paramsForPath],
        };
      } else {
        return undefined;
      }
    })
    .filter(isDefined);

  return operations;
}

function parseOperation(
  parameterRefs: ReferenceParam[],
  operation: OpenAPIV2.OperationObject,
): Omit<Operation, 'method' | 'path'> {
  const {
    deprecated,
    description,
    operationId,
    parameters,
    // consumes,
    summary,
  } = operation;

  invariant(operationId);

  // const responses = parseResponses(operation.responses ?? {});

  const ret = {
    operationId,
    description,
    summary,
    deprecated: deprecated ?? false,
    params: (parameters || []).map((e) => parseParameter(parameterRefs, e)),
    responses: [],
  };

  // if (requestBody) {
  //   invariant(isNotReferenceObject(requestBody), 'not da bod');

  //   const hasJson = requestBody.content['application/json'];
  //   if (hasJson) {
  //     const requestParam = parseRequestBodyParameter(requestBody);
  //     ret.params.push(requestParam);
  //   }
  //   // fixme: do something else here when other type
  // }

  return ret;
}

function parseParameter(
  parameterRefs: ReferenceParam[],
  param: OpenAPIV2.Parameter | OpenAPIV2.ReferenceObject,
): Param | ReferenceParam {
  if (isNotReferenceObject(param)) {
    invariant(param.schema != null, 'wat. cant be null');
    return {
      name: param.name,
      in: getParamKind(param.in),
      type: schemaToType(param.schema),
      required: param.required ?? false,
      description: param.description,
    };
  } else {
    const existingParam = parameterRefs.find(propEq('ref', param.$ref));
    invariant(existingParam != null);
    return existingParam;
  }
}

// function parseResponses(responses: OpenAPIV2.ResponsesObject): ApiResponse[] {
//   return Object.entries(responses).map(([status, response]) => {
//     invariant(isResponseObject(response), 'not a response');
//     return parseResponse(response, status ? Number(status) : 'default');
//   });
// }

// function parseResponse(
//   response: OpenAPIV2.ResponseObject,
//   status: number | 'default',
// ): ApiResponse {
//   return {
//     default: status === 'default',
//     status: typeof status === 'number' ? status : undefined,
//     headers: parseHeaders(response.headers),
//     bodyAlternatives: parseBodies(response.content),
//   };
// }

// function parseHeaders(
//   headers:
//     | Record<string, OpenAPIV2.ReferenceObject | OpenAPIV2.HeaderObject>
//     | undefined,
// ): { name: string; type: AnyType }[] {
//   return Object.entries(headers ?? {})
//     .map(([name, val]) => {
//       return isHeaderObject(val)
//         ? ({ name, type: { kind: 'never' } } as const) // fixme: use schema here
//         : undefined;
//     })
//     .filter(isDefined);
// }

// function parseBodies(
//   bodies: Record<string, MediaTypeObject> | undefined,
// ): { mimeType: string; type: AnyType }[] {
//   return Object.entries(bodies ?? {}).map(([mimeType, val]) => {
//     invariant(val.schema != null, 'not a schema');
//     return { mimeType, type: schemaToType(val.schema) };
//   });
// }

export async function parseOpenApi2(doc: OpenAPIV2.Document): Promise<ApiData> {
  const bundledDoc = await bundle(doc, { dereference: { circular: false } });
  invariant(!('openapi' in bundledDoc), 'waaaaatt'); // make sure it's an openapi2 thing
  // need to do a `getParameters the same way as defs here.

  const definitions = getDefinitions(bundledDoc);
  const operations = getOperations(bundledDoc, []);

  return { referenceTypes: topoSort(definitions), operations: [] };
}
