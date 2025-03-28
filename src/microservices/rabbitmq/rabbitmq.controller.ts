import { PoolTableConsumer } from '@modules/pooltable/pooltable.consumer';
import { Controller, Logger } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';

@Controller()
export class RabbitmqController {
  private readonly logger = new Logger(RabbitmqController.name);
  constructor(private readonly poolTableConsumer: PoolTableConsumer) { }


  @EventPattern('pooltable.upload_qrcode')
  async handleUploadQRCode(data: { id: string }) {
    this.logger.log(`📢 Nhận yêu cầu upload QR code: ${JSON.stringify(data)}`);
    await this.poolTableConsumer.handleUploadQrCode(data);
  }
}