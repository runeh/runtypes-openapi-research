import { AnyType, LiteralType, RecordField } from 'generate-runtypes';
import { OpenAPIV2 } from 'openapi-types';
import { bundle } from 'swagger-parser';
import invariant from 'ts-invariant';
import { ApiData } from '../../common';

// function parseObject(t: NonArraySchemaObject): RecordType {
//   if (isAllOfSchemaObject(t)) {
//     const fields = t.allOf
//       .filter(isSchemaObject)
//       .map(schemaToType)
//       .filter(isRecordType)
//       .flatMap((e) => e.fields);
//     return { kind: 'record', fields: fields };
//   } else {
//     invariant(t.properties, 'no properties');

//     const requiredFields = t.required ?? [];
//     const pairs = Object.entries(t.properties);

//     const fields = pairs.map<RecordField>(([name, entry]) => {
//       return {
//         name,
//         nullable: requiredFields.includes(name),
//         type: schemaToType(entry),
//       };
//     });

//     return { kind: 'record', fields };
//   }
// }

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
  invariant(t.type === 'object');
  invariant(t.properties != null);

  const fields = Object.entries(t.properties).map<RecordField>(
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

export function schemaToType(t: OpenAPIV2.SchemaObject): AnyType {
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
      invariant(t.properties);

      return { kind: 'array', type: schemaToType(t.properties) };
    }

    case 'object':
      return parseObject(t);
  }

  // fixme: do things with oneOf / allOf etc

  throw new Error(`Unable to parse thing of type "${t.type}"`);
}

const lal: OpenAPIV2.SchemaObject = {};

function getDefinitions(doc: OpenAPIV2.Document) {
  // return {
  //   name: param.name,
  //   kind: getParamKind(param.in),
  //   type: schemaToType(param.schema),
  //   required: param.required ?? false,
  //   description: param.description,
  // };

  const definitions = Object.entries(doc.definitions ?? {}).map(
    ([name, def]) => {
      return {
        name,
        description: def.description,
        ref: name,
        type: schemaToType(def),
      };
    },
  );

  console.log(definitions);
  return [];
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

// function getOperations(
//   doc: OpenAPIV2.Document,
//   parameterRefs: ReferenceParam[],
// ) {
//   return Object.entries(doc.paths).flatMap(([path, item]) => {
//     invariant(item != null, 'Must be a thing');
//     return parsePath(parameterRefs, path, item);
//   });
// }

export async function parseOpenApi2(doc: OpenAPIV2.Document): Promise<ApiData> {
  const bundledDoc = await bundle(doc, { dereference: { circular: true } });
  invariant(!('openapi' in bundledDoc)); // make sure it's an openapi2 thing

  // const schemas = getSchemas(bundledDoc);
  const definitions = getDefinitions(bundledDoc);
  // const operations = getOperations(bundledDoc, parameters);

  return {} as any;

  // return {
  //   parameters: topoSort(parameters),
  //   schemas: topoSort(schemas),
  //   operations,
  // };
}
