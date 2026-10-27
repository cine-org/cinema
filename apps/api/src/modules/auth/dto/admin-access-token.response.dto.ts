import { AccessTokenResponseDto } from './access-token.response.dto';

// Accepted by the admin API only; the refresh token is in the admin_refresh_token cookie.
export class AdminAccessTokenResponseDto extends AccessTokenResponseDto {}
