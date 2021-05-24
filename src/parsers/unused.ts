import { AnyType, RootType } from 'generate-runtypes';

/**
 *  Stuff in this file is not in use at the moment
 */

function anyTypeToTsType(type: AnyType): string {
  switch (type.kind) {
    case 'boolean':
    case 'never':
    case 'null':
    case 'number':
    case 'string':
    case 'symbol':
    case 'undefined':
    case 'unknown':
      return type.kind;

    case 'array':
      return `
        ${type.readonly ? 'readonly ' : ''} (${anyTypeToTsType(type.type)})[];
      `.trim();

    case 'union':
      return type.types.map(anyTypeToTsType).join(' | ');

    case 'intersect':
      return type.types.map(anyTypeToTsType).join(' & ');

    case 'dictionary':
      return `Dictionary<string, ${anyTypeToTsType(type.valueType)}>`;

    case 'named':
      return type.name;

    case 'literal':
      return String(type.value);

    case 'function':
      return `() => unknown`;

    case 'record': {
      const fields = type.fields.map((field) => {
        return `${field.readonly ? 'readonly ' : ''}${field.name}${
          field.nullable ? '?' : ''
        }: ${anyTypeToTsType(field.type)}`;
      });
      return `{\n ${fields.join('\n')} \n}`;
    }
  }
}

export function rootToType(root: RootType): string {
  return `type ${root.name} = ${anyTypeToTsType(root.type)}`;
}
