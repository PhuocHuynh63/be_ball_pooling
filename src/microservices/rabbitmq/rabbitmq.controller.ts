import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class RabbitmqController {
  @EventPattern('pooltable.created')
  async handlePoolTableCreated(data: { id: string; store: string }) {
    console.log('📢 Bàn bi-a mới được tạo:', data);
  }
}