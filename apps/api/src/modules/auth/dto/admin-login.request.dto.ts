import { LoginRequestDto } from './login.request.dto';

// Same body as the customer login; only internal accounts get in.
export class AdminLoginRequestDto extends LoginRequestDto {}
