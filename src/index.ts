import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { RootType, generateRuntypes } from 'generate-runtypes';
import { format, resolveConfig } from 'prettier';
import { groupBy, prop, propEq } from 'ramda';
import dedent from 'ts-dedent';
import invariant from 'ts-invariant';
import wrap from 'word-wrap';
import { parse } from 'yaml';
import { ApiData, Operation, isDefined, isOpenApi3 } from './common';
import { parseOpenApi2 } from './parsers/openapi2';
import { parseOpenApi3 } from './parsers/openapi3';

function formatRuntypeName(name: string) {
  return name[0].toLowerCase() + name.slice(1) + 'Rt';
}

function formatTypeName(name: string) {
  return name[0].toUpperCase() + name.slice(1);
}

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

  function pickFromObject<T extends Record<string, unknown>, K extends keyof T>(
    subject: T,
    ...keys: K[]
  ): Pick<T, K> {
    const pairs = keys
      .map((key) => [key, subject[key]])
      .filter(([, val]) => val !== undefined)
      .map(([key, val]) => [key, val]);
    return Object.fromEntries(pairs);
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

function getJsonResponseBodyRuntype(
  operation: Operation,
): RootType | string | undefined {
  const okResponse = operation.responses.find((e) => e.status === 200);
  if (!okResponse) {
    return undefined;
  }

  const jsonResponse = okResponse.bodyAlternatives.find(
    propEq('mimeType', 'application/json'),
  );

  if (!jsonResponse) {
    return undefined;
  }

  if (jsonResponse.type.kind === 'named') {
    return jsonResponse.type.name;
  } else {
    return {
      name: `${operation.operationId}ResponseBody`,
      type: jsonResponse.type,
    };
  }
}

function getOperationComment(operation: Operation): string {
  const raw = dedent`
    operation ID: ${operation.operationId}
    \`${operation.method.toUpperCase()}: ${operation.path}\`
    ${operation.description?.split('\n').join(' ')}
    `;
  return `/**\n${wrap(raw, { indent: ' * ', trim: true, width: 60 })}\n */`;
}

function generateOperationSource(api: ApiData, operation: Operation) {
  const argsRootType = getArgsRuntype(operation);
  const jsonResponseBodyRuntype = getJsonResponseBodyRuntype(operation);

  const inputKinds = groupBy((e) => e.in, operation.params);
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
    getOperationComment(operation),
    `export const ${operation.operationId} = buildCall() //`,
  ];

  if (argsRootType) {
    builderParts.push(
      `.args<rt.Static<typeof ${formatRuntypeName(argsRootType.name)}>>()`,
    );
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

  if (inputKinds.body && inputKinds.body.length > 0) {
    invariant(
      inputKinds.body.length === 1,
      "Don't know how to deal with multiple input bodies",
    );
    const arg = inputKinds.body[0];
    builderParts.push(`.body((args) => args.${arg.name})`);
  }

  if (typeof jsonResponseBodyRuntype === 'string') {
    builderParts.push(
      `.parseJson(withRuntype(${formatRuntypeName(jsonResponseBodyRuntype)}))`,
    );
  } else if (jsonResponseBodyRuntype != null) {
    builderParts.push(
      `.parseJson(withRuntype(${formatRuntypeName(
        jsonResponseBodyRuntype.name,
      )}))`,
    );
  }

  builderParts.push(`.build()`);

  const argsTypeSource = argsRootType
    ? generateRuntypes(argsRootType, {
        format: false,
        includeImport: false,
        includeTypes: false,
        formatRuntypeName,
        formatTypeName,
      })
    : '';

  const responseTypeSource =
    jsonResponseBodyRuntype != null &&
    typeof jsonResponseBodyRuntype !== 'string'
      ? generateRuntypes(jsonResponseBodyRuntype, {
          format: false,
          includeImport: false,
          includeTypes: false,
          formatRuntypeName,
          formatTypeName,
        })
      : '';

  const def = dedent`
  // Operation: ${operation.operationId}

  ${argsTypeSource}

  ${responseTypeSource}
  
  ${builderParts.filter(isDefined).join('\n')}

  `;

  return def;
}

function generateApiSource(api: ApiData) {
  // fixme: Here we need to look at the names and fields and make them safe.
  // As in remove illegal chars, deal with reserved words, etc.
  // currently the `formatRuntypeName` does this well enough.

  const { referenceTypes: types } = api;

  const namedTypes = types.map<RootType>((e) => ({
    name: e.name,
    type: e.type,
  }));

  const typesSource = generateRuntypes(namedTypes, {
    includeTypes: true,
    includeImport: false,
    format: false,
    formatRuntypeName,
    formatTypeName,
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

async function generateFiken() {
  const definitionPath = resolve(__dirname, '../resources/fiken.yaml');
  const raw = await readFile(definitionPath, 'utf-8');
  const parsed = await parse(raw);

  invariant(
    isOpenApi3(parsed),
    'Not handling swagger files yet. Only openapi 3',
  );

  const apiData = await parseOpenApi3(parsed);
  const source = generateApiSource(apiData);
  const prettierConfig = await resolveConfig('./lol.ts');
  const formatted = format(source, prettierConfig ?? undefined);

  const dst = resolve(__dirname, '../generated/fiken.ts');
  await writeFile(dst, formatted);
}

async function generateTripletex() {
  const definitionPath = resolve(__dirname, '../resources/tripletex.json');
  const raw = await readFile(definitionPath, 'utf-8');
  const parsed = await parse(raw);
  const apiData = await parseOpenApi2(parsed);

  const source = generateApiSource(apiData);
  const prettierConfig = await resolveConfig('./lol.ts');
  const formatted = format(source, prettierConfig ?? undefined);

  const dst = resolve(__dirname, '../generated/tripletex.ts');
  await writeFile(dst, formatted);
}

async function generatePetstore() {
  const definitionPath = resolve(__dirname, '../resources/petstore.json');
  const raw = await readFile(definitionPath, 'utf-8');
  const parsed = await parse(raw);
  const apiData = await parseOpenApi2(parsed);

  const source = generateApiSource(apiData);
  const prettierConfig = await resolveConfig('./lol.ts');
  const formatted = format(source, prettierConfig ?? undefined);

  const dst = resolve(__dirname, '../generated/petstore.ts');
  await writeFile(dst, formatted);
}

async function generateUnieconomy() {
  const definitionPath = resolve(__dirname, '../resources/unieconomy.json');
  const raw = await readFile(definitionPath, 'utf-8');
  const parsed = await parse(raw);
  const apiData = await parseOpenApi2(parsed);

  const source = generateApiSource(apiData);
  const prettierConfig = await resolveConfig('./lol.ts');
  const formatted = format(source, prettierConfig ?? undefined);

  const dst = resolve(__dirname, '../generated/unieconomy.ts');
  await writeFile(dst, formatted);
}

async function main() {
  await Promise.all([
    generatePetstore(),
    generateFiken(),
    generateTripletex(),
    generateUnieconomy(),
  ]);
}

main();
