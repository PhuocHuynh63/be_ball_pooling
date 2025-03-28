import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PoolTable } from './entities/poolTable.schema';
import { CreatePoolTableDto } from './dto/create-pooltable.dto';
import { UpdatePoolTableDto } from './dto/update-pooltable.dto';
import { UploadService } from 'src/upload/upload.service';
import * as QRCode from 'qrcode';
import { console } from 'node:inspector';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class PoolTableService {
  constructor(
    @InjectModel(PoolTable.name)
    private poolTableModel: Model<PoolTable>,
    private readonly uploadService: UploadService,
    @Inject('RABBITMQ_SERVICE') private readonly rabbitClient: ClientProxy,
  ) { }

  //#region create
  async create(createPoolTableDto: CreatePoolTableDto): Promise<PoolTable> {
    const { store, ...payload } = createPoolTableDto;
    try {
      // Lưu bàn bi-a vào cơ sở dữ liệu
      const createdPoolTable = await this.poolTableModel.create({
        ...payload,
        store: new Types.ObjectId(store)
      })

      const savedPoolTable = await createdPoolTable.save();

      this.rabbitClient.emit('pooltable.upload_qrcode', { id: savedPoolTable._id });

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
    const poolTable = await this.findOne(id);

    const qrCodeData = poolTable._id;
    const teamWaitingRoomUrl = `https://billiards-score-app.vercel.app/WaitingPage/${qrCodeData}`;

    const qrCodeImage = await QRCode.toDataURL(teamWaitingRoomUrl);
    const uploadResult = await this.uploadService.uploadImage({
      buffer: Buffer.from(qrCodeImage.split(',')[1], 'base64'),
      originalname: `${qrCodeData}-qrcode.png`,
    } as Express.Multer.File, 'qrcodes');

    poolTable.qrCodeImg = uploadResult;

    updatePoolTableDto.store = new Types.ObjectId(updatePoolTableDto.store);

    // Cập nhật các thuộc tính của bàn bi-a
    Object.assign(poolTable, updatePoolTableDto);

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

  //#region findAllPooltableInStore
  async findAllPooltableByStoreID(id: string): Promise<{ number: number, tables: PoolTable[] }> {

    const allTable = await this.poolTableModel.find({ store: new Types.ObjectId(id) }).exec();
    const number = allTable.length;

    return { number, tables: allTable };
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