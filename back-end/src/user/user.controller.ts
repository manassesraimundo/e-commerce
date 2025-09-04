import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { UserService } from './user.service';
import {
  AddressCreateDto,
  AddressUpdateDto,
  UserUpdateDto,
} from './dto/user.dto';

@Controller('user')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getUser(@Req() req: any) {
    const user = await this.userService.getUser(req.user.sub);
    return user;
  }

  @Patch('update')
  async updateUser(@Body() body: UserUpdateDto, @Req() req: any) {
    const message = await this.userService.updateUser(req.user.sub, body);
    return message;
  }

  @Post('address/create')
  async createAddressUser(@Body() body: AddressCreateDto, @Req() req: any) {
    const message = await this.userService.createAddressUser(
      req.user.sub,
      body,
    );
    return message;
  }

  @Patch('address/:addressId/update')
  async updateAddressUser(
    @Param('addressId') addressId: string,
    @Body() body: AddressUpdateDto,
    @Req() req: any,
  ) {
    const message = await this.userService.updateAddressUser(
      req.user.sub,
      body,
      addressId,
    );
    return message;
  }

  @Put('password/update')
  async updatePasswordUser(
    @Body() { password }: { password: string },
    @Req() req: any,
  ) {
    const message = await this.userService.updatePasswordUser(
      req.user.sub,
      password,
    );
    return message;
  }

  @Delete('delete-account')
  async deleteAccountUser(@Req() req: any) {
    const message = await this.userService.deleteAccountUser(req.user.sub);
    return message;
  }
}
