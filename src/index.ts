import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { parse } from 'yaml';
import { parseOpenApi3 } from './parsers/openapi3';

async function main() {
  // const definitionPath = resolve(__dirname, '../resources/tripletex.json');
  const definitionPath = resolve(__dirname, '../resources/fiken.yaml');
  const raw = await readFile(definitionPath, 'utf-8');
  const parsed = await parse(raw);
  if (parsed.swagger) {
    throw new Error('Not handling swagger files yet. Only openapi 3');
  }

  const operations = await parseOpenApi3(parsed);
  console.log(JSON.stringify(operations, null, 2));
}

main();
