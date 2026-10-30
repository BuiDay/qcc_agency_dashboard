export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface AuthMember {
  id: string;
  workspaceId: string;
  role: 'admin' | 'staff' | 'client';
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
  member: AuthMember;
}

interface ApiErrorResponse {
  code?: string;
  message?: string;
}

function logAuthDiagnostic(
  phase: string,
  details: Record<string, string | number>,
): void {
  if (process.env.NODE_ENV !== 'production') {
    console.info('[auth-session]', phase, details);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isWorkspaceRole(value: unknown): value is AuthMember['role'] {
  return value === 'admin' || value === 'staff' || value === 'client';
}

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: 'POST',
      credentials: 'include',
      ...(body === undefined
        ? {}
        : {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }),
    });
  } catch {
    if (path === '/auth/refresh') {
      logAuthDiagnostic('refresh-network-error', { status: 0 });
    }
    throw new AuthApiError('NETWORK_ERROR', 0);
  }

  if (!response.ok) {
    const error = await readApiError(response);
    if (path === '/auth/refresh') {
      logAuthDiagnostic('refresh-rejected', {
        status: response.status,
        code: error.code ?? error.message,
      });
    }
    throw error;
  }

  if (path === '/auth/refresh') {
    logAuthDiagnostic('refresh-succeeded', { status: response.status });
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new AuthApiError('INVALID_RESPONSE', response.status);
  }
}

async function readApiError(response: Response): Promise<AuthApiError> {
  let errorBody: ApiErrorResponse = {};
  try {
    const body: unknown = await response.json();
    if (isRecord(body)) {
      errorBody = {
        ...(typeof body.code === 'string' ? { code: body.code } : {}),
        ...(typeof body.message === 'string' ? { message: body.message } : {}),
      };
    }
  } catch {
    errorBody = {};
  }

  return new AuthApiError(
    errorBody.message ?? 'REQUEST_FAILED',
    response.status,
    errorBody.code,
  );
}

function parseLoginResponse(result: unknown, status: number): LoginResponse {
  const user = isRecord(result) && isRecord(result.user) ? result.user : null;
  const member =
    isRecord(result) && isRecord(result.member) ? result.member : null;
  if (
    !isRecord(result) ||
    typeof result.accessToken !== 'string' ||
    !result.accessToken ||
    !user ||
    typeof user.id !== 'string' ||
    !user.id ||
    typeof user.email !== 'string' ||
    typeof user.name !== 'string' ||
    !member ||
    typeof member.id !== 'string' ||
    !member.id ||
    typeof member.workspaceId !== 'string' ||
    !member.workspaceId ||
    !isWorkspaceRole(member.role)
  ) {
    throw new AuthApiError('INVALID_RESPONSE', status);
  }

  return {
    accessToken: result.accessToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      ...(typeof user.avatar === 'string' ? { avatar: user.avatar } : {}),
    },
    member: {
      id: member.id,
      workspaceId: member.workspaceId,
      role: member.role,
    },
  };
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AuthApiError';
  }
}

const apiBaseUrl = '/api';

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const result = await postJson<unknown>('/auth/login', { email, password });
  return parseLoginResponse(result, 200);
}

export async function logout(): Promise<void> {
  const result = await postJson<unknown>('/auth/logout');
  if (!isRecord(result) || result.success !== true) {
    throw new AuthApiError('INVALID_RESPONSE', 200);
  }
}

export async function restoreSession(): Promise<LoginResponse> {
  const refreshResult = await postJson<unknown>('/auth/refresh');
  if (
    !isRecord(refreshResult) ||
    typeof refreshResult.accessToken !== 'string' ||
    !refreshResult.accessToken
  ) {
    throw new AuthApiError('INVALID_RESPONSE', 200);
  }

  const accessToken = refreshResult.accessToken;
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/auth/me`, {
      credentials: 'include',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    logAuthDiagnostic('profile-network-error', { status: 0 });
    throw new AuthApiError('NETWORK_ERROR', 0);
  }

  if (!response.ok) {
    const error = await readApiError(response);
    logAuthDiagnostic('profile-rejected', {
      status: response.status,
      code: error.code ?? error.message,
    });
    throw error;
  }
  logAuthDiagnostic('profile-succeeded', { status: response.status });

  let profile: unknown;
  try {
    profile = await response.json();
  } catch {
    throw new AuthApiError('INVALID_RESPONSE', response.status);
  }

  if (
    !isRecord(profile) ||
    typeof profile._id !== 'string' ||
    typeof profile.email !== 'string' ||
    typeof profile.name !== 'string' ||
    typeof profile.memberId !== 'string' ||
    typeof profile.workspaceId !== 'string' ||
    !isWorkspaceRole(profile.role)
  ) {
    throw new AuthApiError('INVALID_RESPONSE', response.status);
  }

  return {
    accessToken,
    user: {
      id: profile._id,
      email: profile.email,
      name: profile.name,
      ...(typeof profile.avatar === 'string' ? { avatar: profile.avatar } : {}),
    },
    member: {
      id: profile.memberId,
      workspaceId: profile.workspaceId,
      role: profile.role,
    },
  };
}
