import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { RootType, generateRuntypes } from 'generate-runtypes';
import { format, resolveConfig } from 'prettier';
import { groupBy, prop } from 'ramda';
import dedent from 'ts-dedent';
import { parse } from 'yaml';
import { Operation, isDefined } from './common';
import { ApiData, parseOpenApi3 } from './parsers/openapi3';

const utilsForGenerated = dedent`
  function pickQueryValues<T extends Record<string, unknown>, K extends keyof T>(
    subject: T,
    ...keys: K[]
  ): [key: string, val: string][] {
    return keys
      .map((key) => [key, subject[key]])
      .filter(([, val]) => val !== undefined)
      .map(([key, val]) => [key.toString(), val.toString()]);
  }

  function withRuntype<T>(validator: rt.Runtype<T>) {
    return (data: unknown) => {
      return validator.check(data);
    };
  }

`;

function getArgsRuntype(operation: Operation): RootType | undefined {
  if (operation.params.length === 0) {
    return undefined;
  }

  const name = `${operation.operationId}Args`;
  const rootType: RootType = {
    name,
    type: {
      kind: 'record',
      fields: operation.params.map((e) => ({
        name: e.name,
        type: e.type,
        nullable: !e.required,
        readonly: true,
      })),
    },
  };

  return rootType;
}

function getJsonBodyRuntype(
  operation: Operation,
): RootType | string | undefined {
  const okResponse = operation.responses.find((e) => e.status === 200);
  if (!okResponse) {
    return undefined;
  }

  const jsonResponse = okResponse.bodyAlternatives.find(
    (e) => e.mimeType === 'application/json',
  );

  if (!jsonResponse) {
    return undefined;
  }

  if (jsonResponse.type.kind === 'named') {
    return jsonResponse.type.name;
  } else {
    return undefined;
    // throw new Error(
    //   `Don't know how to deal with "${jsonResponse.type.kind}" response yet`,
    // );
  }
}

function generateOperationSource(api: ApiData, operation: Operation) {
  const argsRootType = getArgsRuntype(operation);
  const jsonBodyRuntype = getJsonBodyRuntype(operation);

  const inputKinds = groupBy((e) => e.kind, operation.params);
  let getPath: string | undefined = undefined;

  if (inputKinds.path) {
    let path = operation.path;
    path = '`' + path + '`';
    for (const param of inputKinds.path) {
      path = path.replace(`{${param.name}}`, `\${args.${param.name}}`);
    }
    getPath = `(args) => ${path}`;
  } else {
    getPath = `'${operation.path}'`;
  }

  const builderParts: (string | undefined)[] = [
    `export const ${operation.operationId} = buildCall() //`,
  ];

  if (argsRootType) {
    builderParts.push(`.args<rt.Static<typeof ${argsRootType.name}>>()`);
  }

  builderParts.push(`.method('${operation.method}')`, `.path(${getPath})`);

  if (inputKinds.query && inputKinds.query.length > 0) {
    const names = inputKinds.query
      .map(prop('name'))
      .map((e) => `'${e}'`)
      .join(', ');

    const getQuery = dedent`
      .query((args) =>new URLSearchParams(pickQueryValues(args, ${names})))`;

    builderParts.push(getQuery);
  }

  if (typeof jsonBodyRuntype === 'string') {
    builderParts.push(`.parseJson(withRuntype(${jsonBodyRuntype}))`);
  }

  builderParts.push(`.build()`);

  const argsTypeSource = argsRootType
    ? generateRuntypes(argsRootType, {
        format: false,
        includeImport: false,
        includeTypes: false,
      })
    : '';

  const def = dedent`
  ${argsTypeSource}

  ${builderParts.filter(isDefined).join('\n')}

  `;

  return def;
}

function generateApiSource(api: ApiData) {
  const { parameters, schemas } = api;

  const namedTypes = [...parameters, ...schemas].map<RootType>((e) => ({
    name: e.typeName,
    type: e.type,
  }));

  const typesSource = generateRuntypes(namedTypes, {
    includeTypes: false,
    includeImport: false,
    format: false,
  });

  const operationsSource = api.operations
    .map((e) => generateOperationSource(api, e))
    .join('\n\n');

  return dedent`
      import * as rt from 'runtypes';
      import { buildCall } from 'typical-fetch';

      ${utilsForGenerated}

      ${typesSource}
      
      ${operationsSource}
    `;
}

async function main() {
  // const definitionPath = resolve(__dirname, '../resources/tripletex.json');
  const definitionPath = resolve(__dirname, '../resources/fiken.yaml');
  const raw = await readFile(definitionPath, 'utf-8');
  const parsed = await parse(raw);
  if (parsed.swagger) {
    throw new Error('Not handling swagger files yet. Only openapi 3');
  }

  const apiData = await parseOpenApi3(parsed);
  const source = generateApiSource(apiData);

  const prettierConfig = await resolveConfig('./lol.ts');
  const formatted = format(source, prettierConfig ?? undefined);

  console.log(formatted);
}

main();
