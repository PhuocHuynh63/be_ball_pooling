import { Injectable, Logger } from '@nestjs/common';
import { PoolTableService } from './pooltable.service';
import { UploadService } from 'src/upload/upload.service';
import * as QRCode from 'qrcode';
import { EventPattern } from '@nestjs/microservices';

@Injectable()
export class PoolTableConsumer {
    private readonly logger = new Logger(PoolTableConsumer.name);

    constructor(
        private readonly poolTableService: PoolTableService,
        private readonly uploadService: UploadService,
    ) { }

    @EventPattern('pooltable.upload_qrcode')
    async handleUploadQrCode(payload: { id: string }) {
        process.stdout.write(`📥 Đã nhận message từ queue: ${JSON.stringify(payload)}`);
        try {
            const poolTable = await this.poolTableService.findOne(payload.id);

            if (!poolTable) {
                this.logger.error(`❌ Không tìm thấy bàn bi-a ID: ${payload.id}`);
                return;
            }

            const qrCodeData = poolTable._id;
            const teamWaitingRoomUrl = `https://billiards-score-app.vercel.app/WaitingPage/${qrCodeData}`;

            const qrCodeImage = await QRCode.toDataURL(teamWaitingRoomUrl);
            const uploadResult = await this.uploadService.uploadImage({
                buffer: Buffer.from(qrCodeImage.split(',')[1], 'base64'),
                originalname: `${qrCodeData}-qrcode.png`,
            } as Express.Multer.File, 'qrcodes');

            // Cập nhật URL QR code vào database
            await this.poolTableService.update(payload.id, { qrCodeImg: uploadResult });

            this.logger.log(`✅ QR code đã được upload cho bàn bi-a ID: ${payload.id}`);
        } catch (error) {
            this.logger.error(`❌ Upload QR code thất bại cho bàn bi-a ID: ${payload.id}`, error);
            throw error;
        }
    }
}