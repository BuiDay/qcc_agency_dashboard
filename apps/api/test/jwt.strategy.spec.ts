import { extractAccessToken } from '../src/auth/strategies/jwt.strategy';

describe('extractAccessToken', () => {
  it('ưu tiên cookie qcc_access', () => {
    expect(
      extractAccessToken({
        cookies: { qcc_access: 'cookie-token' },
        headers: { authorization: 'Bearer header-token' },
      }),
    ).toBe('cookie-token');
  });

  it('đọc Bearer token không phân biệt hoa thường', () => {
    expect(
      extractAccessToken({
        headers: { authorization: 'bearer header-token' },
      }),
    ).toBe('header-token');
  });

  it('bỏ qua Authorization sai định dạng', () => {
    expect(
      extractAccessToken({
        headers: { authorization: 'Basic credentials' },
      }),
    ).toBeNull();
  });
});
