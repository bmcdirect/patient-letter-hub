/**
 * Jest TypeScript Setup Verification Test
 * This test verifies that Jest is properly configured with TypeScript support
 */

describe('Jest TypeScript Setup', () => {
  test('should support TypeScript syntax', () => {
    interface TestData {
      id: number;
      name: string;
      active: boolean;
    }

    const testItem: TestData = {
      id: 1,
      name: 'Test Item',
      active: true
    };

    expect(testItem.id).toBe(1);
    expect(testItem.name).toBe('Test Item');
    expect(testItem.active).toBe(true);
  });

  test('should handle async/await operations', async () => {
    const asyncFunction = async (value: string): Promise<string> => {
      return Promise.resolve(`processed: ${value}`);
    };

    const result = await asyncFunction('test');
    expect(result).toBe('processed: test');
  });

  test('should support array and object operations', () => {
    const numbers: number[] = [1, 2, 3, 4, 5];
    const doubled = numbers.map(n => n * 2);
    const sum = numbers.reduce((acc, n) => acc + n, 0);

    expect(doubled).toEqual([2, 4, 6, 8, 10]);
    expect(sum).toBe(15);
  });
});