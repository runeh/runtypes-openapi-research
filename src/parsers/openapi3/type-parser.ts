import {
  AnyType,
  LiteralType,
  RecordField,
  RecordType,
} from 'generate-runtypes';
import invariant from 'ts-invariant';
import {
  NonArraySchemaObject,
  SchemaObject,
  isAllOfSchemaObject,
  isRecordType,
  isSchemaObject,
} from './common';

/**
 * Parse a "string" schema type. Strings are either strings or
 * a list of string literals
 * fixme: any other variants?
 * @param t
 * @returns
 */
function parseString(t: NonArraySchemaObject): AnyType {
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

function parseObject(t: NonArraySchemaObject): RecordType {
  if (isAllOfSchemaObject(t)) {
    const fields = t.allOf
      .filter(isSchemaObject)
      .map(schemaToType)
      .filter(isRecordType)
      .flatMap((e) => e.fields);
    return { kind: 'record', fields: fields };
  } else {
    invariant(t.properties);

    const requiredFields = t.required ?? [];
    const pairs = Object.entries(t.properties);

    const fields = pairs.map<RecordField>(([name, entry]) => {
      invariant(isSchemaObject(entry));
      return {
        name,
        nullable: requiredFields.includes(name),
        type: schemaToType(entry),
      };
    });

    return { kind: 'record', fields };
  }
}

export function schemaToType(t: SchemaObject): AnyType {
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

    case 'object':
      return parseObject(t);
  }

  // `type` is not required on schema objects (╯°□°)╯︵ ┻━┻

  if (isAllOfSchemaObject(t)) {
    return parseObject(t);
  }

  // some times you get `format` but not `type` (╯°□°)╯︵ ┻━┻
  switch (t.format) {
    case 'float':
    case 'int32':
    case 'int64': {
      console.warn('Got format but no type');
      return { kind: 'number' };
    }
  }

  throw new Error(`Unable to parse thing of type "${t.type}"`);
}
