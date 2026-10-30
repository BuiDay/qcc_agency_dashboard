import { WorkspaceRole } from '@qcc/shared';

export interface WorkspaceMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  active: boolean;
}

interface ApiErrorBody {
  code?: string;
  message?: string;
}

export class MembersApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'MembersApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return Object.values(WorkspaceRole).some((role) => role === value);
}

function parseMember(value: unknown): WorkspaceMember {
  if (!isRecord(value) || !isRecord(value.userId)) {
    throw new MembersApiError('INVALID_RESPONSE', 200);
  }

  const memberId = value._id;
  const userId = value.userId._id;
  const { name, email } = value.userId;
  if (
    typeof memberId !== 'string' ||
    typeof userId !== 'string' ||
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    !isWorkspaceRole(value.role) ||
    typeof value.active !== 'boolean'
  ) {
    throw new MembersApiError('INVALID_RESPONSE', 200);
  }

  return {
    id: memberId,
    userId,
    name,
    email,
    role: value.role,
    active: value.active,
  };
}

async function readError(response: Response): Promise<MembersApiError> {
  let message = 'REQUEST_FAILED';
  try {
    const body: unknown = await response.json();
    if (isRecord(body)) {
      const error = body as ApiErrorBody;
      message = error.code ?? error.message ?? message;
    }
  } catch {
    // Keep the HTTP status when the server does not return a JSON error.
  }
  return new MembersApiError(message, response.status);
}

async function request(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      credentials: 'include',
      ...init,
    });
  } catch {
    throw new MembersApiError('NETWORK_ERROR', 0);
  }
  if (!response.ok) throw await readError(response);
  return response;
}

export async function listMembers(): Promise<WorkspaceMember[]> {
  const response = await request('/members');
  const body: unknown = await response.json();
  if (!Array.isArray(body)) throw new MembersApiError('INVALID_RESPONSE', 200);
  return body.map(parseMember);
}

export async function createMember(input: {
  name: string;
  email: string;
  password: string;
  role: WorkspaceRole;
}): Promise<void> {
  await request('/members', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}

export async function updateMember(
  memberId: string,
  input: { role?: WorkspaceRole; active?: boolean },
): Promise<void> {
  await request(`/members/${encodeURIComponent(memberId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
}
