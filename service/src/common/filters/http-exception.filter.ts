import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';

const STATUS_CODE_MAP: Record<number, number> = {
  400: 40000,
  401: 40100,
  403: 40300,
  404: 40400,
  409: 40900,
  500: 50000,
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const payload = exception.getResponse() as { message?: string | string[] } | string;

    let message = 'error';
    if (typeof payload === 'string') {
      message = payload;
    } else if (payload?.message) {
      message = Array.isArray(payload.message) ? payload.message.join('; ') : payload.message;
    } else if (exception.message) {
      message = exception.message;
    }

    const code = STATUS_CODE_MAP[status] ?? 50000;
    response.status(status).json({
      code,
      message,
      data: null,
    });
  }
}
