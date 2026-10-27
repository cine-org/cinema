-- Invitations of internal accounts: a one-time code, like a password reset.
ALTER TYPE "AuthChallengePurpose" ADD VALUE 'ACCOUNT_INVITATION';
