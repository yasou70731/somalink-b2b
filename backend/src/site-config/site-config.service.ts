import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteConfig, SiteBlock } from './entities/site-config.entity';
import { randomUUID } from 'crypto'; 

@Injectable()
export class SiteConfigService {
  constructor(
    @InjectRepository(SiteConfig)
    private repo: Repository<SiteConfig>,
  ) {}

  // --- 首頁配置 (Homepage Config) ---
  
  // 取得設定 (如果沒有就建立預設值)
  async getHomepageConfig() {
    let config = await this.repo.findOneBy({ key: 'homepage' });
    
    // 如果沒有設定，初始化預設積木
    if (!config) {
      const defaultBlocks: SiteBlock[] = [
        // 1. Hero 主視覺區塊
        {
          id: randomUUID(),
          type: 'HERO',
          data: {
            title: '極致工藝，\n定義空間新維度。',
            subtitle: '專為室內設計師與專業經銷商打造的 B2B 數位工廠。',
            images: ["https://images.unsplash.com/photo-1600607686527-6fb886090705?auto=format&fit=crop&q=80&w=2000"]
          }
        },
        // 2. 特色介紹區塊
        {
          id: randomUUID(),
          type: 'FEATURES',
          data: {
            title: '為什麼選擇松成？',
            items: [
              { title: '六點矩陣丈量', desc: '獨家開發數位丈量系統，確保安裝完美貼合。' },
              { title: '連工帶料 / 純料', desc: '彈性的服務模式，滿足不同工班需求。' },
              { title: '全數位化履歷', desc: '全程透明化追蹤，讓您對業主更有交代。' }
            ]
          }
        },
        // 3. 產品列表區塊
        {
          id: randomUUID(),
          type: 'PRODUCT_LIST',
          data: {
            title: '熱門產品系列',
            count: 4
          }
        }
      ];

      config = this.repo.create({
        key: 'homepage',
        blocks: defaultBlocks
      });
      await this.repo.save(config);
    }
    return config;
  }

  // 更新首頁設定
  async updateHomepageConfig(data: Partial<SiteConfig>) {
    // 移除 key 避免被覆寫，確保 key 永遠是 'homepage'
    const { key, ...updateData } = data;
    
    // 確保資料庫有資料 (如果沒有會先建立預設值)
    await this.getHomepageConfig();
    
    await this.repo.update('homepage', updateData);
    return this.repo.findOneBy({ key: 'homepage' });
  }

  // --- 系統規則 (System Rules) ---
  
  async getSystemRules() {
    let config = await this.repo.findOneBy({ key: 'system_rules' });
    
    // 如果還沒有規則，建立預設值
    if (!config) {
      config = this.repo.create({
        key: 'system_rules',
        // 這裡依賴 Entity 中的 settings 欄位 (JSONB)
        settings: {
          // 1. 營運開關
          enable_registration: true, // 是否開放註冊
          maintenance_mode: false,   // 是否維護中
          allow_guest_view: true,    // 是否允許訪客瀏覽

          // 2. 會員價格策略
          discount_level_A: 0.85,    // A 級 85 折
          discount_level_B: 0.95,    // B 級 95 折

          // 3. 訂單流水號重置日 (每月幾號)
          order_reset_day: 1,

          // 4. 公司基本資料 (Footer 顯示用)
          company_name: '松成有限公司',
          tax_id: '12345678',
          phone: '(02) 2345-6789',
          address: '新北市三重區... (範例地址)',
          copyright_text: '© 2025 SomaLink. All rights reserved.'
        }
      });
      await this.repo.save(config);
    }
    return config;
  }

  // 更新系統規則
  async updateSystemRules(settings: any) {
    // 確保有資料
    await this.getSystemRules();
    
    // 更新 settings JSON 欄位
    await this.repo.update('system_rules', { settings });
    return this.repo.findOneBy({ key: 'system_rules' });
  }
}