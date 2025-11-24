import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TradeCategory } from './entities/trade-category.entity';
import { DealerProfile, DealerLevel, TradeType } from './entities/dealer-profile.entity'; // 確保正確引入 Enum

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(TradeCategory)
    private tradeCategoriesRepository: Repository<TradeCategory>,
    @InjectRepository(DealerProfile)
    private dealerProfileRepository: Repository<DealerProfile>,
  ) {}

  // 1. 註冊 (Create)
  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({ 
      where: { email: createUserDto.email } 
    });
    
    if (existingUser) {
      throw new ConflictException('此 Email 已經被註冊');
    }

    const user = new User();
    user.email = createUserDto.email;
    user.name = createUserDto.name;
    
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(createUserDto.password, salt);

    if (createUserDto.tradeCategoryId && createUserDto.tradeCategoryId.trim() !== '') {
      const tradeCategory = await this.tradeCategoriesRepository.findOneBy({ 
        id: createUserDto.tradeCategoryId 
      });
      if (!tradeCategory) throw new NotFoundException('選擇的營業類別無效');
      user.tradeCategory = tradeCategory;
    } else {
      user.tradeCategory = null;
    }

    if (createUserDto.dealerProfile) {
      const profile = new DealerProfile();
      Object.assign(profile, createUserDto.dealerProfile);
      profile.level = DealerLevel.C; 
      profile.isVerified = false;
      profile.walletBalance = 0;
      profile.isUpgradeable = false; 
      // 如果需要，可以根據 tradeCategory 來設定 tradeType
      // profile.tradeType = ... 
      
      user.dealerProfile = profile;
    }

    try {
      user.isActive = false;
      return await this.usersRepository.save(user);
    } catch (error: any) {
      console.error('Registration Error:', error);
      if (error.code === '23505') { 
        throw new ConflictException('資料重複 (Email 或統編已存在)');
      }
      throw new InternalServerErrorException('註冊失敗，請稍後再試');
    }
  }

  // 2. 查詢所有用戶
  async findAll() {
    return this.usersRepository.find({
      relations: ['tradeCategory', 'dealerProfile'],
    });
  }

  // 3. 查詢單一用戶
  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['tradeCategory', 'dealerProfile'],
    });
    if (!user) throw new NotFoundException(`找不到用戶 #${id}`);
    return user;
  }

  // 4. 透過 Email 查詢
  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['tradeCategory', 'dealerProfile'],
    });
  }

  // 5. 更新基本資料
  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.usersRepository.update(id, {
      isActive: updateUserDto.isActive,
      role: updateUserDto.role,
    });
    return this.findOne(id);
  }

  // 6. 刪除用戶
  async remove(id: string) {
    const user = await this.findOne(id);
    return this.usersRepository.remove(user);
  }

  // ✨ 7. 切換啟用狀態 (toggleActive) - 補上缺失的方法
  async toggleActive(id: string, isActive: boolean) {
    const user = await this.findOne(id);
    user.isActive = isActive;
    return this.usersRepository.save(user);
  }

  // ✨ 8. 更新會員等級 (updateLevel) - 補上缺失的方法
  async updateLevel(id: string, level: DealerLevel) {
    const user = await this.findOne(id);
    if (user.dealerProfile) {
      user.dealerProfile.level = level;
      await this.dealerProfileRepository.save(user.dealerProfile); 
    }
    return this.usersRepository.save(user); // 回傳更新後的用戶
  }

  // ✨ 9. 錢包儲值 (deposit) - 補上缺失的方法
  async deposit(id: string, amount: number) {
    const user = await this.findOne(id);
    if (!user.dealerProfile) {
      throw new NotFoundException('此用戶沒有經銷商檔案，無法儲值');
    }
    
    // 轉換為數字以確保計算正確 (Postgres decimal 回傳可能是 string)
    const currentBalance = Number(user.dealerProfile.walletBalance || 0);
    const addAmount = Number(amount);
    
    user.dealerProfile.walletBalance = currentBalance + addAmount;
    
    await this.dealerProfileRepository.save(user.dealerProfile);
    return user;
  }

  // ✨ 10. 升級為管理員 (makeAdmin) - 補上缺失的方法
  async makeAdmin(email: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`找不到用戶: ${email}`);
    }
    
    user.role = UserRole.ADMIN; // 使用 Enum 設定權限
    return this.usersRepository.save(user);
  }
}