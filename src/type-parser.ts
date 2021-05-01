import { AnyType, LiteralType } from 'generate-runtypes';
import { OpenAPIV3 } from 'openapi-types';
import invariant from 'ts-invariant';

/**
 * Parse a "string" schema type. Strings are either strings or
 * a list of string literals
 * fixme: any other variants?
 * @param t
 * @returns
 */
function parseString(t: OpenAPIV3.NonArraySchemaObject): AnyType {
  invariant(t.type === 'string');

  if (t.enum) {
    return {
      kind: 'union',
      types: t.enum.map<LiteralType>((e) => ({ kind: 'literal', value: e })),
    };
  } else {
    return { kind: 'string' };
  }
}

export function schemaToType(t: OpenAPIV3.SchemaObject): AnyType {
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
      // fixme: util for this?
      invariant(!('$ref' in t.items));
      return { kind: 'array', type: schemaToType(t.items) };
    }
  }

  throw new Error(`Unable to parse thing of type "${t.type}"`);
}
