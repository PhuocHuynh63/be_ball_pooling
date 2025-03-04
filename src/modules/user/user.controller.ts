import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, NotFoundException, BadRequestException, Put, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateAuthDto } from '../../auth/dto/create-auth.dto';
import { updateUsersDto } from './dto/update-user.dto';
import { request } from 'https';
import { UploadService } from 'src/upload/upload.service';
import { FileInterceptor } from '@nestjs/platform-express';


@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService, 
              private readonly uploadService: UploadService
  ) { }

  @Get('find')
  async find(@Query() query: any) {
    return await this.userService.find(query);
  }
  

  @Put(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(@Param('id') id: string, @Body() updateUsersDto: updateUsersDto, @UploadedFile() file: Express.Multer.File) {
    if (file) {
      console.log('id:', id);
      const user = await this.userService.findOne(id); 
      const urlAvatar = await this.uploadService.uploadImage(file, user.avatar);
      updateUsersDto.avatar = urlAvatar; // Set lại URL vào thuộc tính avatar
    }

    return await this.userService.updateUser(id, updateUsersDto);
  }

  

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.userService.delete(id);
  }

}