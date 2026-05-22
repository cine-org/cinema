export type ErrorDetail = {
  field?: string;
  message: string;
  code?: string;
};

export type ErrorResponse = {
  success: false;
  message: string;
  code: string;
  errors?: ErrorDetail[];
  timestamp: string;
  requestId?: string;
};
