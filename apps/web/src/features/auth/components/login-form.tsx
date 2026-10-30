'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthApiError, login } from '../api/auth-api';
import { useAuth } from '../auth-provider';

type FieldErrors = {
  email?: string;
  password?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function EyeIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 5.2A10.7 10.7 0 0112 5c5.2 0 8.8 4.8 9.5 6-.3.6-1.6 2.4-3.6 3.8M6.2 6.3C4.1 7.7 2.8 9.7 2.5 11c.7 1.2 4.3 6 9.5 6 1 0 1.9-.2 2.7-.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  ) : (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path
        d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function BrandMark({ mobile = false }: { mobile?: boolean }) {
  return (
    <div className={mobile ? 'wordmark mobile-wordmark' : 'wordmark'}>
      <span className="wordmark-mark" aria-hidden="true">
        Q
      </span>
      <span>QCC AGENCY</span>
    </div>
  );
}

export function LoginForm() {
  const router = useRouter();
  const { setSession, status } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/my-tasks');
    }
  }, [router, status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();
    const nextErrors: FieldErrors = {};

    if (!normalizedEmail) {
      nextErrors.email = 'Vui lòng nhập email.';
    } else if (!isValidEmail(normalizedEmail)) {
      nextErrors.email = 'Vui lòng nhập email hợp lệ.';
    }
    if (!password) nextErrors.password = 'Vui lòng nhập mật khẩu.';

    setErrors(nextErrors);
    setSubmitError('');
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const session = await login(normalizedEmail, password);
      setSession(session);
      setPassword('');
      router.replace('/my-tasks');
    } catch (error) {
      setPassword('');
      if (!(error instanceof AuthApiError)) throw error;

      if (error.status === 401) {
        setSubmitError(
          'Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.',
        );
      } else if (error.status === 0) {
        setSubmitError('Chưa thể kết nối. Vui lòng thử lại sau.');
      } else if (error.status >= 500) {
        setSubmitError('Hệ thống đang gặp sự cố. Vui lòng thử lại sau.');
      } else {
        setSubmitError('Chưa thể đăng nhập. Vui lòng kiểm tra lại thông tin.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function clearFieldError(field: keyof FieldErrors) {
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError('');
  }

  return (
    <main className="login-shell">
      <div className="login-card">
        <section className="brand-panel" aria-label="Giới thiệu QCC Agency">
          <div className="brand-top">
            <BrandMark />
          </div>

          <div className="brand-copy">
            <div className="brand-eyebrow">Không gian làm việc của bạn</div>
            <h1>
              Làm việc
              <br />
              rõ ràng.
              <br />
              <span>Đúng hạn.</span>
            </h1>
            <p>
              Mọi dự án, mọi đầu việc — cùng một nơi để cả đội phối hợp dễ
              dàng hơn.
            </p>
          </div>

          <div className="brand-bottom">
            <span className="brand-bottom-dot" aria-hidden="true" />
            <span>QCC Agency · Workspace nội bộ</span>
          </div>
        </section>

        <section className="form-panel" aria-labelledby="login-title">
          <div className="login-form-wrap">
            <BrandMark mobile />
            <p className="form-kicker">Chào mừng trở lại</p>
            <h2 className="form-heading" id="login-title">
              Chào bạn
            </h2>
            <p className="form-description">
              Đăng nhập để xem công việc của bạn.
            </p>

            {submitError && (
              <div className="login-alert login-alert-error" role="alert">
                <span aria-hidden="true">!</span>
                <span>{submitError}</span>
              </div>
            )}

            <form noValidate onSubmit={handleSubmit}>
              <div className="login-fields">
                <div className="field">
                  <label className="field-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    autoComplete="username"
                    autoFocus
                    className="field-input"
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    placeholder="ten@congty.com"
                    value={email}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearFieldError('email');
                    }}
                  />
                  {errors.email && (
                    <p className="field-error" id="email-error">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="password">
                    Mật khẩu
                  </label>
                  <div className="field-control">
                    <input
                      autoComplete="current-password"
                      className="field-input field-input-password"
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Nhập mật khẩu"
                      value={password}
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={
                        errors.password ? 'password-error' : undefined
                      }
                      onChange={(event) => {
                        setPassword(event.target.value);
                        clearFieldError('password');
                      }}
                    />
                    <button
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      aria-pressed={showPassword}
                      className="password-toggle"
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                    >
                      <EyeIcon visible={showPassword} />
                    </button>
                  </div>
                  {errors.password && (
                    <p className="field-error" id="password-error">
                      {errors.password}
                    </p>
                  )}
                </div>
              </div>

              <button
                className="submit-button"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    <span>Đang đăng nhập...</span>
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>

            <div className="demo-note" role="note">
              <span className="demo-note-mark" aria-hidden="true">
                i
              </span>
              <span>
                Đăng nhập bằng tài khoản do quản trị viên workspace cấp.
              </span>
            </div>

            <footer className="login-footer">
              © 2026 QCC Agency · Dành cho đội ngũ nội bộ
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
