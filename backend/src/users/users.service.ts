import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { TradeCategory } from './entities/trade-category.entity';
import { DealerProfile, DealerLevel, TradeType } from './entities/dealer-profile.entity'; 
import { NotificationsService } from '../notifications/notifications.service';

// ✨✨✨ 硬性規則 (Hardcoded Rules) 定義區 ✨✨✨
export const DEALER_LIMITS = {
  [DealerLevel.A]: 200000, // A 級 20萬
  [DealerLevel.B]: 100000, // B 級 10萬
  [DealerLevel.C]: 0,      // C 級不可儲值
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(TradeCategory)
    private tradeCategoriesRepository: Repository<TradeCategory>,
    @InjectRepository(DealerProfile)
    private dealerProfileRepository: Repository<DealerProfile>,
    private notificationsService: NotificationsService,
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
      // ✨ Fix: 強制轉型為 any 以解決 TypeScript 對 null 的嚴格檢查
      user.tradeCategory = null as any;
    }

    if (createUserDto.dealerProfile) {
      const profile = new DealerProfile();
      Object.assign(profile, createUserDto.dealerProfile);
      profile.level = DealerLevel.C; 
      profile.isVerified = false;
      profile.walletBalance = 0;
      profile.isUpgradeable = false; 
      
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

  // 5. 更新基本資料 (管理員用)
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

  // 7. 切換啟用狀態
  async toggleActive(id: string, isActive: boolean) {
    const user = await this.findOne(id);
    user.isActive = isActive;
    return this.usersRepository.save(user);
  }

  // 8. 更新會員等級
  async updateLevel(id: string, level: DealerLevel) {
    const user = await this.findOne(id);
    if (user.dealerProfile) {
      user.dealerProfile.level = level;
      await this.dealerProfileRepository.save(user.dealerProfile); 
    }
    return this.usersRepository.save(user); 
  }

  // 9. 錢包儲值 (引用 Hardcoded Rules)
  async deposit(id: string, amount: number) {
    const user = await this.findOne(id);
    if (!user.dealerProfile) {
      throw new NotFoundException('此用戶沒有經銷商檔案，無法儲值');
    }
    
    const currentBalance = Number(user.dealerProfile.walletBalance || 0);
    const addAmount = Number(amount);
    const newBalance = currentBalance + addAmount;
    
    // 取得該等級的上限
    const limit = DEALER_LIMITS[user.dealerProfile.level] || 0;

    // 檢查 C 級
    if (user.dealerProfile.level === DealerLevel.C) {
      throw new ConflictException('C 級會員不可進行儲值');
    }

    // 檢查單筆上限
    if (addAmount > limit) {
        throw new ConflictException(`單筆儲值金額超過 ${user.dealerProfile.level} 級上限 (${limit})`);
    }
    
    user.dealerProfile.walletBalance = newBalance;
    
    await this.dealerProfileRepository.save(user.dealerProfile);
    return user;
  }

  // 10. 升級為管理員
  async makeAdmin(email: string) {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`找不到用戶: ${email}`);
    }
    
    user.role = UserRole.ADMIN; 
    return this.usersRepository.save(user);
  }

  // 11. 更新個人資料邏輯
  async updateProfile(userId: string, data: any) {
    const user = await this.findOne(userId);
    
    // 1. 更新基本資料
    if (data.name) user.name = data.name;
    
    // 2. 更新密碼 (如果有填)
    if (data.password) {
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(data.password, salt);
    }

    // 3. 更新經銷商資料 (DealerProfile)
    if (data.dealerProfile && user.dealerProfile) {
      if (data.dealerProfile.companyName) user.dealerProfile.companyName = data.dealerProfile.companyName;
      if (data.dealerProfile.taxId) user.dealerProfile.taxId = data.dealerProfile.taxId;
      if (data.dealerProfile.contactPerson) user.dealerProfile.contactPerson = data.dealerProfile.contactPerson;
      if (data.dealerProfile.phone) user.dealerProfile.phone = data.dealerProfile.phone;
      if (data.dealerProfile.address) user.dealerProfile.address = data.dealerProfile.address;
      
      // 儲存關聯資料
      await this.dealerProfileRepository.save(user.dealerProfile);
    }

    // 儲存 User 本體
    const savedUser = await this.usersRepository.save(user);

    // 4. 發送 Line 通知給管理員
    try {
      const dealerName = savedUser.dealerProfile?.companyName || savedUser.email;
      const msg = `🔔 會員資料變更通知\n客戶：${dealerName}\n狀態：已在後台自行更新資料，請確認。`;
      this.notificationsService.sendLineNotify(msg).catch(err => console.log('Line 通知略過 (開發模式)'));
    } catch (e) {
      console.error('發送通知失敗', e);
    }

    return savedUser;
  }
}