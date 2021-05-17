import { AnyType, NamedType, RecordType } from 'generate-runtypes';
import { map, prop } from 'ramda';
import { HttpMethods } from './parsers/openapi3/common';

export type ParamKind = 'query' | 'header' | 'path' | 'cookie' | 'body';

// fixme: this needs content type
export interface Param {
  kind: ParamKind;
  name: string;
  required: boolean;
  type: AnyType;
  description?: string;
}

export interface ReferenceParam extends Param {
  ref: string;
  typeName: string;
}

export interface Schema {
  name: string;
  ref: string;
  type: AnyType;
  typeName: string;
  description?: string;
}

export interface ApiResponse {
  default: boolean;
  status?: number;
  headers: { name: string; type: AnyType }[];
  bodyAlternatives: { mimeType: string; type: AnyType }[];
}

export interface Operation {
  operationId: string;
  method: HttpMethods;
  path: string;
  deprecated: boolean;
  params: Param[];
  responses: ApiResponse[];
  description?: string;
  summary?: string;
}

export interface ApiData {
  schemas: Schema[];
  parameters: ReferenceParam[];
  operations: Operation[];
}

export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

export function getParamKind(str: string): ParamKind {
  switch (str) {
    case 'body':
    case 'cookie':
    case 'header':
    case 'path':
    case 'query':
      return str;
  }
  throw new Error(`Invalid param kind "${str}"`);
}

export function isRecordType(type: AnyType): type is RecordType {
  return type.kind === 'record';
}

function getNamedTypes(t: AnyType): NamedType[] {
  switch (t.kind) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'symbol':
    case 'undefined':
    case 'function':
    case 'literal':
    case 'never':
    case 'null':
    case 'unknown':
      return [];
    case 'named':
      return [t];
    case 'array':
      return getNamedTypes(t.type);
    case 'dictionary':
      return getNamedTypes(t.valueType);
    case 'intersect':
      return t.types.flatMap(getNamedTypes);
    case 'record':
      return t.fields.map(prop('type')).flatMap(getNamedTypes);
    case 'union':
      return t.types.flatMap(getNamedTypes);
  }
}

/**
 * Very ugly topological sort, to make sure runtypes are emitted in the right
 * order. Adapted from
 * https://jeremyckahn.github.io/javascript-algorithms/graphs_others_topological-sort.js.html
 */
export function topoSort<T extends { type: AnyType; typeName: string }>(
  things: T[],
): T[] {
  const topologicalSortHelper = (
    node: string,
    visited: Record<string, boolean>,
    temp: Record<string, boolean>,
    graph: Record<string, string[]>,
    result: string[],
  ) => {
    temp[node] = true;
    const neighbors = graph[node];
    for (let i = 0; i < neighbors.length; i += 1) {
      const n = neighbors[i];
      if (temp[n]) {
        throw new Error('The graph is not a DAG');
      }
      if (!visited[n]) {
        topologicalSortHelper(n, visited, temp, graph, result);
      }
    }
    temp[node] = false;
    visited[node] = true;
    result.push(node);
  };

  const graph = Object.fromEntries(
    things.map((thing) => [
      thing.typeName,
      getNamedTypes(thing.type).map(prop('name')),
    ]),
  );

  const result: string[] = [];
  const visited: Record<string, boolean> = {};
  const temp: Record<string, boolean> = {};
  for (const node of Object.keys(graph)) {
    if (!visited[node] && !temp[node]) {
      topologicalSortHelper(node, visited, temp, graph, result);
    }
  }

  return result
    .map((e) => things.find((thing) => thing.typeName === e))
    .filter(isDefined);
}
