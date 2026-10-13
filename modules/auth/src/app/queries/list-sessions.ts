import { Injectable } from '@nestjs/common';
import { AuthSessionReadRepository, type ActiveSessionView } from '../ports';

export class ListSessionsQuery {
  constructor(readonly props: { readonly accountId: string; readonly currentSessionId: string }) {}
}

export type SessionListItem = ActiveSessionView & { readonly isCurrent: boolean };

@Injectable()
export class ListSessionsHandler {
  constructor(private readonly sessions: AuthSessionReadRepository) {}

  // Most recently refreshed first.
  async execute(query: ListSessionsQuery): Promise<SessionListItem[]> {
    const { accountId, currentSessionId } = query.props;
    const sessions = await this.sessions.listActive(accountId, new Date());
    return sessions.map((session) => ({ ...session, isCurrent: session.id === currentSessionId }));
  }
}
