import {
  AnyType,
  LiteralType,
  RecordField,
  RecordType,
} from 'generate-runtypes';
import invariant from 'ts-invariant';
import {
  NonArraySchemaObject,
  ReferenceObject,
  SchemaObject,
  isAllOfSchemaObject,
  isRecordType,
  isReferenceObject,
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

function parseObject(t: NonArraySchemaObject): RecordType {
  if (isAllOfSchemaObject(t)) {
    const fields = t.allOf
      .filter(isSchemaObject)
      .map(schemaToType)
      .filter(isRecordType)
      .flatMap((e) => e.fields);
    return { kind: 'record', fields: fields };
  } else {
    invariant(t.properties, 'no properties');

    const requiredFields = t.required ?? [];
    const pairs = Object.entries(t.properties);

    const fields = pairs.map<RecordField>(([name, entry]) => {
      return {
        name,
        nullable: requiredFields.includes(name),
        type: schemaToType(entry),
      };
    });

    return { kind: 'record', fields };
  }
}

function titleCase(str: string) {
  return str[0].toLocaleUpperCase() + str.slice(1);
}

export function refToName(ref: ReferenceObject | string): string {
  const refName = typeof ref === 'string' ? ref : ref.$ref;
  const match = /#\/components\/(.*)s\/(\w+)/.exec(refName);
  invariant(match != null, `Couldn't parse ref name "${refName}"`);

  const [, kind, name] = match;

  return `${name}${titleCase(kind)}`;
}

export function schemaToType(t: SchemaObject | ReferenceObject): AnyType {
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
