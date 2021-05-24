import { getNamedTypes } from '../common';

describe('getNamedTypes', () => {
  it('smoke test', () => {
    const ret = getNamedTypes({
      kind: 'record',
      fields: [
        { name: 'field1', type: { kind: 'named', name: 'Person' } },
        { name: 'field2', type: { kind: 'named', name: 'Animal' } },
        { name: 'field3', type: { kind: 'named', name: 'Person' } },
        {
          name: 'field4',
          type: {
            kind: 'record',
            fields: [
              { name: 'nestedField1', type: { kind: 'named', name: 'Person' } },
              { name: 'nestedField2', type: { kind: 'named', name: 'Animal' } },
              { name: 'nestedField3', type: { kind: 'named', name: 'Robot' } },
            ],
          },
        },
      ],
    });
    expect(ret).toEqual([
      { kind: 'named', name: 'Person' },
      { kind: 'named', name: 'Animal' },
      { kind: 'named', name: 'Robot' },
    ]);
  });
});
