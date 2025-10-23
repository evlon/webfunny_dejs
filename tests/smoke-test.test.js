/**
 * 冒烟测试 - 验证测试框架基本功能
 * 不依赖de.js，只测试Jest配置是否正常
 */

describe('冒烟测试', () => {
  test('Jest基本功能正常', () => {
    expect(1 + 1).toBe(2);
  });

  test('字符串匹配正常', () => {
    expect('hello world').toContain('hello');
  });

  test('数组操作正常', () => {
    const arr = [1, 2, 3];
    expect(arr).toContain(2);
    expect(arr.length).toBe(3);
  });

  test('对象操作正常', () => {
    const obj = { a: 1, b: 2 };
    expect(obj.a).toBe(1);
    expect(obj.b).toBe(2);
  });
});