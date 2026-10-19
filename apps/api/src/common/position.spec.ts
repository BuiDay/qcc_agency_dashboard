import { positionBetween } from './position';

describe('positionBetween', () => {
  it('sinh vị trí đầu tiên', () => {
    expect(positionBetween(null, null)).toBe('V');
  });

  it('luôn nằm giữa 2 vị trí', () => {
    const a = positionBetween(null, null);
    const b = positionBetween(a, null);
    const mid = positionBetween(a, b);
    expect(a < mid && mid < b).toBe(true);
    const top = positionBetween(null, a);
    expect(top < a).toBe(true);
  });

  it('chèn liên tục vào cùng một chỗ vẫn giữ đúng thứ tự', () => {
    let low = positionBetween(null, null);
    const high = positionBetween(low, null);
    for (let i = 0; i < 200; i++) {
      const next = positionBetween(low, high);
      expect(low < next && next < high).toBe(true);
      low = next;
    }
  });

  it('thêm liên tục vào cuối danh sách', () => {
    const keys: string[] = [];
    let last: string | null = null;
    for (let i = 0; i < 300; i++) {
      last = positionBetween(last, null);
      keys.push(last);
    }
    expect([...keys].sort()).toEqual(keys);
  });

  it('báo lỗi khi before >= after', () => {
    expect(() => positionBetween('b', 'a')).toThrow();
  });
});
