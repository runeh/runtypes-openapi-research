import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { RootType, generateRuntypes } from 'generate-runtypes';
import { format, resolveConfig } from 'prettier';
import { groupBy } from 'ramda';
import dedent from 'ts-dedent';
import { parse } from 'yaml';
import { Operation } from './common';
import { ApiData, parseOpenApi3 } from './parsers/openapi3';

function generateOerationSource(api: ApiData, operation: Operation) {
  const allArgs = operation.params.map((e) => ({ name: e.name }));

  const inputArgs = `{ ${allArgs.map((e) => `${e.name}: unknown`)} }`;

  const inputKinds = groupBy((e) => e.kind, operation.params);

  let getPath: string | undefined = undefined;

  if (inputKinds.path) {
    let path = operation.path;
    path = '`' + path + '`';
    for (const param of inputKinds.path) {
      path = path.replace(`{${param.name}}`, `\${params.${param.name}}`);
    }
    getPath = `(params) => ${path}`;
  } else {
    getPath = `'${operation.path}'`;
  }

  // if (inputKinds.query) {
  //   console.log(JSON.stringify(inputKinds.query, null, 2));
  // }

  const def = dedent`
    const ${operation.operationId} = buildCall() //
      .args<${inputArgs}>()
      .method('${operation.method}')
      .path(${getPath})
      .build()
  `;
  return def;
}

function generateApiSource(api: ApiData) {
  const { parameters, schemas, operations } = api;

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
    .map((e) => generateOerationSource(api, e))
    .join('\n\n');

  return typesSource + operationsSource;
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

  // console.log(JSON.stringify(operations, null, 2));
}

main();
