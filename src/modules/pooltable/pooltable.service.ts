import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PoolTable } from './entities/poolTable.schema';
import { CreatePoolTableDto } from './dto/create-pooltable.dto';
import { UpdatePoolTableDto } from './dto/update-pooltable.dto';
import { UploadService } from 'src/upload/upload.service';
import * as QRCode from 'qrcode';

@Injectable()
export class PoolTableService {
  constructor(
    @InjectModel(PoolTable.name) private poolTableModel: Model<PoolTable>,
    private readonly uploadService: UploadService
  ) {}
  
   //#region create
   async create(createPoolTableDto: CreatePoolTableDto): Promise<PoolTable> {
    const {...payload} = createPoolTableDto;
    try {
      // Lưu bàn bi-a vào cơ sở dữ liệu
      const createdPoolTable = await this.poolTableModel.create({
          ...payload,
          store: new Types.ObjectId(payload.store)
        })
      
      const savedPoolTable = await createdPoolTable.save();

      // Tạo mã QR từ ID của bàn bi-a
      const qrCodeData = savedPoolTable._id;

      const teamWaitingRoomUrl = `https://fewebballpooling.vercel.app/team-waiting-room/${qrCodeData}`;
      
      const qrCodeImage = await QRCode.toDataURL(teamWaitingRoomUrl);

      // Lưu mã QR vào Cloudinary
      const uploadResult = await this.uploadService.uploadImage({
        buffer: Buffer.from(qrCodeImage.split(',')[1], 'base64'),
        originalname: `${qrCodeData}-qrcode.png`,
      } as Express.Multer.File, 'qrcodes');

      
      // Cập nhật URL của mã QR vào cơ sở dữ liệu
      savedPoolTable.qrCodeImg = uploadResult;
      await savedPoolTable.save();

      return savedPoolTable;


    } catch (error) {
      if (error.code === 11000) { // Duplicate key error code
        throw new ConflictException('QR code already exists');
      }
      throw error;
    }
  }
  //#endregion

  //#region update
  async update(id: string, updatePoolTableDto: UpdatePoolTableDto): Promise<PoolTable> {
    const poolTable = await this.poolTableModel.findById(id).exec();
    if (!poolTable || poolTable.deletedAt) {
      throw new NotFoundException('Pool table not found');
    }

    // Cập nhật các thuộc tính của bàn bi-a
    Object.assign(poolTable, updatePoolTableDto);

    // Nếu cần cập nhật mã QR
    if (updatePoolTableDto.generateNewQRCode) {
      const qrCodeData = poolTable._id;
      const teamWaitingRoomUrl = `https://fewebballpooling.vercel.app/team-waiting-room/${qrCodeData}`;
      const qrCodeImage = await QRCode.toDataURL(teamWaitingRoomUrl);

      // Lưu mã QR vào Cloudinary
      const uploadResult = await this.uploadService.uploadImage(
        {
          buffer: Buffer.from(qrCodeImage.split(',')[1], 'base64'),
          originalname: `${qrCodeData}-qrcode.png`,
        } as Express.Multer.File,
        'qrcodes'
      );

      // Cập nhật URL của mã QR vào cơ sở dữ liệu
      poolTable.qrCodeImg = uploadResult;
    }

    return poolTable.save();
  }
  //#endregion

  //#region delete
  async delete(id: string): Promise<PoolTable> {
    const poolTable = await this.poolTableModel.findById(id).exec();
    if (!poolTable || poolTable.deletedAt) {
      throw new NotFoundException('Pool table not found');
    }

    poolTable.deletedAt = new Date();
    poolTable.status = 'unavailable';
    return poolTable.save();
  }
  //#endregion  

  //#region findAll
  async findAll(): Promise<PoolTable[]> {
    return this.poolTableModel.find({ deletedAt: null }).exec();
  }
  //#endregion

  //#region findOne
  async findOne(id: string): Promise<PoolTable> {
    const poolTable = await this.poolTableModel.findById(id).exec();
    if (!poolTable || poolTable.deletedAt) {
      throw new NotFoundException('Pool table not found');
    }
    return poolTable;
  }
  //#endregion

  //#region findAllIncludingDeleted
  async findAllIncludingDeleted(): Promise<PoolTable[]> {
    return this.poolTableModel.find().exec();
  }
  //#endregion

  //#region findAllByStatus
  async findAllByStatus(status: string): Promise<PoolTable[]> {
    return this.poolTableModel.find({ status, deletedAt: null }).exec();
  }
  //#endregion

  
}