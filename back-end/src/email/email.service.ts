import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  sendEmail(message: string) {
    console.log(message);
  }
}
