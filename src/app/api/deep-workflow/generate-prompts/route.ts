import { NextResponse } from 'next/server';
import { getTextModelFallback } from '@/lib/image-models';
import type { ProductAnalysis, DesignBible, GeneratedPrompt, ListingBlueprint, ImageBlueprint } from '@/lib/deep-workflow/types';

interface GeneratePromptsRequest {
  analysis: ProductAnalysis;
  designBible: DesignBible;
  preferences: {
    platform: string;
    selectedHolidays: string[];
    selectedAudiences: string[];
    customHoliday?: string;
    customAudience?: string;
    visualStyle: string;
    colorScheme: string;
    emotion: string;
  };
}

/**
 * 根据产品类型获取产品使用场景描述
 * 用于生成生活方式图片的场景设定
 * 
 * @param productType - 产品类型（如 "T-shirt", "blanket", "mug" 等）
 * @param productName - 产品名称（如 "定制毛毯", "个性化马克杯" 等）
 * @returns 中文场景描述
 */
function getProductUsageScene(productType: string, productName: string): string {
  const type = productType.toLowerCase();
  const name = productName.toLowerCase();
  
  // ===== 衣服类 =====
  if (type.includes('shirt') || type.includes('t-shirt') || type.includes('clothing') || 
      name.includes('shirt') || name.includes('t-shirt') || name.includes('衣服') || name.includes('T恤')) {
    return '人物穿着该服装，在日常生活中展示穿着效果和风格';
  }
  
  // ===== 包袋和洗漱包 =====
  if (type.includes('bag') || type.includes('toiletry') || type.includes('pouch') || 
      name.includes('bag') || name.includes('洗漱包') || name.includes('化妆包') || name.includes('收纳包')) {
    return '产品装满物品展示容量和收纳功能，在浴室或旅行场景中';
  }
  
  // ===== 毛毯和床上用品 =====
  if (type.includes('blanket') || type.includes('throw') || type.includes('bedding') || 
      name.includes('blanket') || name.includes('毛毯') || name.includes('毯子') || name.includes('被子')) {
    return '产品铺在床或沙发上，在卧室或客厅展示温馨使用场景';
  }
  
  // ===== 壁画和装饰画 =====
  if (type.includes('art') || type.includes('painting') || type.includes('poster') || type.includes('decor') || 
      name.includes('画') || name.includes('装饰画') || name.includes('海报') || name.includes('wall art')) {
    return '人物正在墙上挂画或调整画作位置，在家中展示装饰效果';
  }
  
  // ===== 马克杯和饮具 =====
  if (type.includes('mug') || type.includes('cup') || type.includes('glass') || 
      name.includes('mug') || name.includes('杯子') || name.includes('马克杯')) {
    return '人物手持或使用马克杯喝茶/咖啡，温馨的厨房或办公室场景';
  }
  
  // ===== 首饰和配饰 =====
  if (type.includes('jewelry') || type.includes('necklace') || type.includes('bracelet') || 
      name.includes('jewelry') || name.includes('项链') || name.includes('手链') || name.includes('首饰')) {
    return '人物佩戴该首饰，展示佩戴效果';
  }
  
  // ===== 砧板和厨房用品 =====
  if (type.includes('cutting board') || type.includes('kitchen') || type.includes('board') || 
      name.includes('cutting board') || name.includes('砧板') || name.includes('菜板')) {
    return '产品在厨房台面上使用，展示切菜准备食物的功能性';
  }
  
  // ===== 枕头和抱枕 =====
  if (type.includes('pillow') || type.includes('cushion') || 
      name.includes('pillow') || name.includes('枕头') || name.includes('抱枕')) {
    return '产品摆放在沙发或床上，展示舒适度和装饰美感';
  }
  
  // ===== 蜡烛和香薰 =====
  if (type.includes('candle') || type.includes('diffuser') || 
      name.includes('candle') || name.includes('蜡烛') || name.includes('香薰')) {
    return '产品在桌子或架子上点燃或使用，营造温馨氛围';
  }
  
  // ===== 手机壳和数码配件 =====
  if (type.includes('phone case') || type.includes('tech') || 
      name.includes('phone case') || name.includes('手机壳') || name.includes('保护壳')) {
    return '手机配壳后被人手持使用，展示保护性和时尚感';
  }
  
  // ===== 书籍和笔记本 =====
  if (type.includes('book') || type.includes('notebook') || type.includes('journal') || 
      name.includes('book') || name.includes('笔记本') || name.includes('日记本')) {
    return '产品在书桌或温馨阅读角被人书写或阅读';
  }
  
  // ===== 杯垫和小家居用品 =====
  if (type.includes('coaster') || name.includes('coaster') || name.includes('杯垫')) {
    return '产品在桌子上配合饮料使用，展示日常实用场景';
  }
  
  // ===== 装饰摆件 =====
  if (type.includes('ornament') || name.includes('ornament') || name.includes('装饰品') || name.includes('摆件')) {
    return '产品在架子或桌子上作为装饰点缀展示在家中';
  }
  
  // ===== 默认兜底 =====
  return '产品在真实生活场景中展示实际使用，产品始终为视觉焦点';
}

/**
 * 获取节日专属文案
 * 用于生成送礼图片的文字内容
 * 
 * @param holiday - 节日类型（如 "fathers_day", "mothers_day", "christmas" 等）
 * @returns { headline: 主标题, subheadline: 副标题, cta: 行动召唤 }
 */
function getHolidayText(holiday: string): { headline: string; subheadline: string; cta: string } {
  const holidayMap: Record<string, { headline: string; subheadline: string; cta: string }> = {
    // ===== 父亲节 =====
    'fathers_day': { headline: '父亲节快乐', subheadline: '一份他会珍藏的礼物', cta: '献给爸爸' },
    // ===== 母亲节 =====
    'mothers_day': { headline: '母亲节快乐', subheadline: '一份她会珍藏的礼物', cta: '献给妈妈' },
    // ===== 圣诞节 =====
    'christmas': { headline: '圣诞快乐', subheadline: '完美的节日礼物', cta: '欢乐季节' },
    // ===== 情人节 =====
    'valentines_day': { headline: '做我的情人', subheadline: '发自内心的礼物', cta: '献给爱人' },
    // ===== 生日 =====
    'birthday': { headline: '生日快乐', subheadline: '让这一天特别', cta: '庆祝时刻' },
    // ===== 婚礼 =====
    'wedding': { headline: '恭喜新婚', subheadline: '给新人的礼物', cta: '幸福美满' },
    // ===== 乔迁 =====
    'housewarming': { headline: '乔迁之喜', subheadline: '适合新生活的开始', cta: '家是温馨的港湾' },
    // ===== 纪念 =====
    'memorial': { headline: '永远怀念', subheadline: '永远在我们心中', cta: '珍藏记忆' },
  };
  
  // 默认兜底文案
  return holidayMap[holiday] || { headline: '用心定制', subheadline: '一份美好的礼物', cta: '立即选购' };
}

/**
 * 根据目标受众生成情感故事场景
 * 用于生成第3张图片（情感故事）的场景设定
 * 
 * @param selectedAudiences - 目标受众列表（如 ["mom", "dad", "partner"] 等）
 * @returns 中文场景描述
 */
function generateStoryScene(selectedAudiences: string[]): string {
  const audience = selectedAudiences[0] || '特别的人';
  
  // 各受众的情感故事场景
  const scenes: Record<string, string> = {
    // ===== 妈妈 =====
    'mom': '妈妈温柔地手持个性化礼物，眼中闪烁着喜悦的光芒，看到自己的名字优雅地刻在产品上，周围环绕着柔和温暖的灯光',
    // ===== 爸爸 =====
    'dad': '爸爸自豪地展示个性化产品，露出真诚的欣赏微笑，展现出这份专为他定制的礼物所带来的感动',
    // ===== 爱人 =====
    'partner': '情侣分享亲密时刻，手持个性化礼物，浪漫的氛围，强调两人之间的独特纽带',
    // ===== 朋友 =====
    'friend': '好朋友兴奋地拆开个性化礼物，真诚的惊喜和喜悦，庆祝他们的特殊友谊',
    // ===== 孩子 =====
    'child': '孩子的脸上洋溢着惊喜，看到自己的名字出现在个性化产品上，纯粹的快乐和兴奋',
    // ===== 祖父母 =====
    'grandparent': '祖父母珍藏个性化纪念品，与家庭的情感联系，礼物承载着珍贵的记忆',
  };
  
  // 默认兜底场景
  return scenes[audience.toLowerCase()] 
    || `人物与他们的个性化礼物产生情感共鸣，展现出对这份用心定制的深深感激`;
}

/**
 * 根据节日和受众生成送礼场景
 * 用于生成第4张图片（真实送礼瞬间）的场景设定
 * 
 * 优先级逻辑：
 * - 有节日：用节日场景
 * - 无节日但有受众：用受众主题
 * - 自定义节日/受众：直接使用用户填写的内容
 * - 都没有：通用 fallback
 * 
 * @param holidayHeadline - 节日主标题
 * @param selectedHolidays - 已选择的节日列表
 * @param selectedAudiences - 已选择的受众列表
 * @param customHoliday - 自定义节日
 * @param customAudience - 自定义受众
 * @returns 中文场景描述
 */
function audienceLabelForCustom(selectedAudiences: string[], customAudience: string): string {
  if (selectedAudiences[0] === 'custom' && customAudience.trim()) {
    return customAudience.trim();
  }
  return selectedAudiences[0] || '心爱的人';
}

function generateGiftingScene(
  holidayHeadline: string,
  selectedHolidays: string[],
  selectedAudiences: string[],
  customHoliday: string = '',
  customAudience: string = ''
): string {
  const hasCustomHoliday = selectedHolidays[0] === 'custom';
  const hasCustomAudience = selectedAudiences[0] === 'custom';

  // ===== 自定义节日 / 受众：直接用用户填写的内容 =====
  if (hasCustomHoliday && customHoliday.trim()) {
    const audienceText = hasCustomAudience && customAudience.trim()
      ? customAudience.trim()
      : audienceLabelForCustom(selectedAudiences, customAudience);
    return `一个真实的送礼瞬间，庆祝${customHoliday.trim()}，收礼人是${audienceText}，真诚温暖的反应，个性化产品被递交或打开，环境和道具适合${customHoliday.trim()}的场合`;
  }
  if (hasCustomAudience && customAudience.trim()) {
    const holidayText = (selectedHolidays[0] && selectedHolidays[0] !== 'custom' && holidayHeadline)
      ? holidayHeadline
      : '';
    const leadIn = holidayText
      ? `${holidayText}期间的一个真实送礼瞬间，收礼人是${customAudience.trim()}`
      : `一个真实送礼瞬间，收礼人是${customAudience.trim()}`;
    return `${leadIn}，真诚温暖的反应，个性化产品被递交或打开，真实环境，两人在一个自然瞬间`;
  }

  const holiday = (selectedHolidays[0] || '').toLowerCase();
  const audience = (selectedAudiences[0] || '').toLowerCase();
  const audienceLabel = selectedAudiences[0] || '心爱的人';

  // ===== 节日场景 =====
  const holidayScenes: Record<string, string> = {
    'christmas': '美丽的圣诞早晨场景，收礼人在闪烁的灯光和节日装饰下拆开个性化礼物',
    'valentines_day': '浪漫的情人节场景，玫瑰和蜡烛，收礼人收到发自内心的个性化礼物',
    'fathers_day': '父亲节家庭庆祝场景，爸爸自豪地打开他的个性化礼物',
    'mothers_day': '母亲节聚餐场景，妈妈被孩子们的贴心个性化礼物感动',
    'birthday': '生日庆祝场景，气球和蛋糕，生日人惊喜地收到个性化礼物',
    'wedding': '婚礼礼物桌场景或新人交换个性化纪念品，庆祝他们的结合',
  };

  // ===== 受众场景 =====
  const audienceScenes: Record<string, string> = {
    'mom': '妈妈温柔地手持个性化礼物，温暖心动的表情，温馨的家庭环境，柔和的自然光',
    'dad': '爸爸自豪地收到个性化礼物，真诚欣赏的微笑，与家人的温馨时刻',
    'partner': '情侣分享亲密的送礼时刻，浪漫温暖的氛围',
    'friend': '好朋友兴奋地收到个性化礼物，真诚的惊喜和喜悦，欢乐的友谊时刻',
    'child': '孩子手持个性化礼物，眼中闪烁着惊喜，纯粹的快乐和兴奋',
    'grandparent': '祖父母珍藏个性化纪念品，情感家庭联系，珍贵的记忆',
    'men': '一个真实男性收到个性化礼物，真诚温暖的反应，男性现代客厅或工作室环境，自然自信的表情，送礼瞬间在两人之间显得真实',
    'women': '一个真实女性收到个性化礼物，真诚温暖的反应，优雅的家或咖啡馆环境，自然快乐的表情，送礼瞬间在两人之间显得真实',
    'couple': '一对情侣交换个性化礼物，亲密的自然瞬间，温馨的家庭环境，两人都表现出真实的情感',
    'kids': '一个真实孩子收到个性化礼物，眼中充满惊喜，多彩有趣的场景，纯真的快乐',
    'teens': '一个真实青少年收到个性化礼物，休闲时尚的卧室或聚会场所，自然兴奋的反应',
    'elderly': '一个真实老年人收到个性化礼物，温柔温暖的表情，舒适的家庭环境，感人的时刻',
  };

  // ===== 优先级：节日 > 受众 > 通用 fallback =====
  if (holiday && holidayScenes[holiday]) {
    return holidayScenes[holiday];
  }
  if (audience && audienceScenes[audience]) {
    return audienceScenes[audience];
  }
  if (holidayHeadline) {
    return `${holidayHeadline}庆祝场景，${audienceLabel}收到个性化礼物，真诚的惊喜和喜悦`;
  }
  return `${audienceLabel}收到个性化礼物，真诚的惊喜和喜悦，温暖庆祝的氛围`;
}

/**
 * 根据目标受众生成生活方式场景
 * 用于生成第6张图片（生活方式展示）的场景设定
 * 
 * @param selectedAudiences - 目标受众列表（如 ["mom", "dad", "partner"] 等）
 * @returns 中文场景描述
 */
function generateLifestyleScene(selectedAudiences: string[]): string {
  const audience = selectedAudiences[0] || '用户';
  
  // 各受众的生活方式场景
  const scenes: Record<string, string> = {
    // ===== 妈妈 =====
    'mom': '忙碌的妈妈在温馨的厨房或客厅享受安静时刻，她的个性化物品为日常增添了个人触感',
    // ===== 爸爸 =====
    'dad': '爸爸在周末放松或做自己喜欢的事情时使用个性化物品，欣赏这份用心定制',
    // ===== 爱人 =====
    'partner': '情侣的家，个性化物品融入他们共同的空间，浪漫温馨的氛围',
    // ===== 朋友 =====
    'friend': '朋友聚会，个性化礼物被自豪地展示，在轻松的环境中庆祝他们的友谊',
    // ===== 孩子 =====
    'child': '孩子的卧室或游戏区，个性化物品为他们的个人空间增添了特殊感',
    // ===== 祖父母 =====
    'grandparent': '祖父母舒适的家，个性化纪念品被展示，周围环绕着家庭照片',
  };
  
  // 默认兜底场景
  return scenes[audience.toLowerCase()] 
    || `人物在日常生活中享受他们的个性化物品，展示定制如何为日常时刻增添意义`;
}

/**
 * 根据用户的6图框架生成图片蓝图
 * 用于定义每张图片的类型、目标、场景、相机角度等所有参数
 * 
 * @param index - 图片序号（1-6）
 * @param type - 图片类型（hero/customization/story/gifting/features/lifestyle）
 * @param analysis - 产品分析结果
 * @param designBible - 设计圣经（配色、风格等）
 * @param holidayText - 节日文案
 * @param preferences - 用户偏好设置
 * @returns 图片蓝图对象
 */
function generateImageBlueprint(
  index: number,
  type: string,
  analysis: ProductAnalysis,
  designBible: DesignBible,
  holidayText: { headline: string; subheadline: string; cta: string },
  preferences: GeneratePromptsRequest['preferences']
): ImageBlueprint {
  const blueprints: Record<string, ImageBlueprint> = {
    
    // ============================================================
    // 第1张：主图 - 白底展示
    // ============================================================
    hero: {
      index: 1,
      type: '主图 - 白底展示',
      goal: '纯白背景展示产品全貌，突出定制区域细节，强调个性化特征，保留参考图中现有的定制内容',
      headline: analysis.product_name,
      subheadline: analysis.selling_points[0] || '优质品质',
      scene: '纯白背景 RGB 255,255,255，专业工作室灯光，产品展示与参考图完全相同的定制设计/图案——完美保留现有个性化内容不做任何更改',
      camera: '正面3/4角度，定制区域超特写展示精致细节，产品占画面85%，戏剧性灯光让个性化元素成为无可争议的焦点',
      lighting: '柔和漫射工作室灯光，战略性地聚焦定制区域，增强质感，让定制设计在产品表面清晰突出',
      emotion: '奢华的专属感，精湛工艺，强调这是为客户专门定制的独特商品',
      composition: '产品居中，视觉层级引导眼睛关注个性化细节，微妙的阴影创造深度同时保持焦点在独特的定制上，保留参考图中的现有定制内容',
      elements: ['完美保留现有个性化', '清晰聚焦定制设计细节', '专业工作室质量', '定制设计作为视觉锚点', '高端定制展示', '保持参考图定制内容'],
      text_content: { headline: '', subheadline: '' }
    },
    
    // ============================================================
    // 第2张：定制流程展示 - 人物手持产品展示定制细节
    // ============================================================
    customization: {
      index: 2,
      type: '定制流程展示',
      goal: '展示人物手持产品，展示定制流程和工艺，保持产品原有尺寸和比例',
      headline: '为你专属定制',
      subheadline: '简单定制流程',
      scene: `人物手持产品，清晰展示可定制区域，展示如何添加个性化内容如雕刻或设计。${analysis.dimensions ? `关键尺寸信息：产品尺寸为 ${analysis.dimensions.length || ''} x ${analysis.dimensions.width || ''} x ${analysis.dimensions.height || ''}。人物应手持产品以清晰展示真实尺寸——手的位置展示比例，产品不应显得比实际尺寸大或小。` : '保持参考图中产品的精确比例、尺寸和缩放'}`,
      camera: '中景展示双手手持产品，定制区域被突出，相机角度选择强调真实产品比例和尺寸相对于双手，准确的比例展示',
      lighting: '清晰工作室灯光，聚焦产品细节',
      emotion: '专业信息展示，清晰呈现定制选项',
      composition: '产品居中，准确尺寸展示，双手定位展示真实比例，定制区域突出显示，保持真实比例',
      elements: ['人物手持产品展示准确比例，双手作为尺寸参照', '定制区域被突出', '清晰展示个性化选项', '专业呈现', '真实产品尺寸', '手部比例参照'],
      text_content: { headline: '轻松定制', subheadline: '让它属于你' }
    },
    
    // ============================================================
    // 第3张：情感故事 - 强调"为谁定制"的专属感
    // ============================================================
    story: {
      index: 3,
      type: '情感故事',
      goal: '讲述专属定制故事，强调"这是为谁定制的"以及背后的情感意义，突出独一无二的专属感，采用精美电商排版设计，保留产品上的现有定制内容',
      headline: '为特别的人定制',
      subheadline: '独一无二',
      scene: `${generateStoryScene(preferences.selectedAudiences)}。关键：产品展示与参考图完全相同的定制设计/图案——姓名、照片、艺术作品或文字必须完美保留不做任何修改`,
      camera: '专业产品摄影配艺术构图，产品策略性定位，现有定制设计清晰可见且不变，美丽文字叠加元素',
      lighting: '柔和工作室灯光配温暖金色调，营造奢华氛围，个性化细节上有柔和高光',
      emotion: '深度个人情感联系， overwhelming joy，被独特珍视的感觉',
      composition: '现代电商布局，产品作为主角展示保留的定制设计，优雅文字元素艺术性排列周围，装饰花纹和微妙背景图案增强视觉吸引力但不分散注意力',
      elements: ['精美造型产品配保留的定制', '优雅排版元素', '柔和装饰花纹', '高端背景纹理', '艺术构图', '专业电商风格', '情感视觉叙事', '完美保持现有定制设计'],
      text_content: { headline: '专属你的', subheadline: '为你定制的礼物' }
    },
    
    // ============================================================
    // 第4张：真实人物之间的送礼瞬间
    // ============================================================
    gifting: {
      index: 4,
      type: '真实送礼瞬间',
      goal: '以专业电商排版的视觉语言展示一个真实人物之间正在互相送礼的瞬间：有人正把定制产品递给收礼人，收礼人正打开/看到/惊讶/微笑。突出收礼人看到定制内容那一刻的真实情感反应和礼物的独特性。要明确根据目标受众的人群（性别/年龄/角色）来生成场景中的人物，禁止默认女性，禁止性别模糊。保持产品原图比例和定制内容不变。文案排版要求符合 Amazon A+ 专业电商排版标准：清晰层级、留白、字体、配色协调。',
      headline: holidayText.headline,
      subheadline: holidayText.subheadline,
      scene: `两个真实人物之间的送礼瞬间，配专业电商排版：${generateGiftingScene(holidayText.headline, preferences.selectedHolidays, preferences.selectedAudiences, preferences.customHoliday, preferences.customAudience)}。场景描绘真实的人物瞬间——有人正在递交或打开个性化产品，收礼人展示真实反应（惊喜、微笑、欢笑、情感回应）。两人根据目标受众（年龄、性别、角色）真实呈现。不要默认女性；根据目标受众明确匹配性别和年龄。无工作室背景、无礼盒、无丝带、无包装纸、无节日装饰叠加。产品裸露展示/未包装，从一人递给另一人。保持参考图中产品的精确比例、尺寸和缩放。完美保持产品的定制设计。整体布局遵循专业电商排版：清晰视觉层级、充足留白、标题+副标题+正文平衡、排版颜色和权重符合Amazon A+高端Listing标准。`,
      camera: '自然抓拍摄影，视线高度或略高，两人在温馨瞬间构图，两张脸清晰可见并展示真实情感，个性化产品清晰可见并在他们之间展示准确比例。构图为标题+副标题+正文叠加留有清洁空间，符合专业电商排版间距',
      lighting: '适合场景设置的自然环境光（温馨家居光、柔和日光或真实环境）——非工作室柔光灯。真实捕捉肤色和产品表面',
      emotion: holidayText.headline
        ? `真实送礼瞬间，真实人类的惊喜和喜悦反应，${holidayText.headline}的温暖`
        : '真实送礼瞬间，真实人类的惊喜和喜悦反应，温暖庆祝感觉',
      composition: '抓拍双人构图。送礼者在一边，收礼者在另一边，个性化产品在中心或正在递交。两人完全在画面内，脸和情感清晰可见。真实环境背景（家、咖啡馆、工作室等）——非工作室背景。产品尺寸/比例必须精确匹配参考图。应用专业电商排版布局：清晰标题/副标题/正文层级、产品周围充足留白、平衡构图、排版和配色符合Amazon A+高端Listing标准',
      elements: [
        '两个真实人物在自然瞬间',
        '真实环境（家、咖啡馆、工作室等），非工作室',
        '个性化产品正在递交或在他们之间打开',
        '两人展示真实情感反应',
        '产品准确真实尺寸，定制设计保留',
        '自然环境光，无工作室柔光灯',
        '无礼盒、无包装、无丝带、无包装材料',
        '无节日装饰叠加',
        '专业电商排版：标题+副标题+正文配清晰层级',
        '充足留白和平衡视觉构图'
      ],
      text_content: holidayText.headline
        ? { headline: `与${holidayText.headline}共庆`, subheadline: '为你独家定制的礼物' }
        : { headline: '为你定制的礼物', subheadline: '庆祝每一刻' }
    },
    
    // ============================================================
    // 第5张：产品特点展示 - 结合定制元素
    // ============================================================
    features: {
      index: 5,
      type: '产品特点展示',
      goal: '展示4个核心产品特点，同时突出定制选项和个性化可能性，创造视觉层次，保持产品原有尺寸和比例',
      headline: '你会爱上它的原因',
      subheadline: '个性化完美',
      scene: '优雅造型构图，产品配美丽可见的个性化——展示产品上现有的定制设计——周围环绕4个精美呈现的特点亮点，展示高端材质、精湛工艺、无限定制选项和卓越品质。保持参考图中产品的精确比例、尺寸和缩放',
      camera: '艺术排列，产品作为主角在准确比例，每个特点配视觉提示指向定制可能性',
      lighting: '工作室灯光配戏剧性阴影创造深度，突出产品特点和个性化细节',
      emotion: '高端工艺，无限个性化可能性，令人向往的定制奢华，对定制质量的信心',
      composition: '产品配可见定制作为主角在准确真实尺寸，4个特点亮点艺术性排列周围，全程保持正确产品比例',
      elements: ['产品准确真实尺寸', '艺术特点呈现', '展示高端材质', '保留现有定制', '专业造型配视觉层级', '保持正确产品比例'],
      text_content: { 
        headline: '个性化品质', 
        subheadline: '独特 • 定制 • 你的' 
      }
    },
    
    // ============================================================
    // 第6张：生活方式展示 - 强调定制内容的生活意义
    // ============================================================
    lifestyle: {
      index: 6,
      type: '生活方式展示',
      goal: '展示个性化产品在真实生活中的意义和使用场景，强调定制内容如何融入日常生活，突出专属定制带来的独特生活体验，采用精美电商排版设计，保持产品原有尺寸和比例，保留产品上的现有定制内容',
      headline: '你故事的一部分',
      subheadline: '独一无二的你',
      scene: `${generateLifestyleScene(preferences.selectedAudiences)}。${analysis.dimensions ? `重要：产品尺寸为 ${analysis.dimensions.length || ''} x ${analysis.dimensions.width || ''} x ${analysis.dimensions.height || ''}。在真实尺寸展示产品——相对于人物和环境应显得适当大小/小。` : ''}关键：产品展示与参考图完全相同的定制设计/图案——完美保留所有现有个性化（姓名、照片、文字、艺术作品）不做任何更改`,
      camera: '专业生活摄影配艺术构图，产品在准确比例使用，现有定制设计清晰可见且不变，相机定位清晰展示产品与人物/环境的尺寸关系，美丽文字元素艺术性排列在场景周围',
      lighting: '柔和自然光配温暖金色调，营造邀请氛围，个性化细节和文字元素上有柔和高光',
      emotion: '舒适的熟悉感配独家奢华触感，珍贵的日常仪式，看到产品在真实使用中带来情感联系',
      composition: '现代电商布局，个性化产品在准确真实尺寸使用展示保留的定制设计，人物自然互动产品展示正确比例，优雅标题文字在顶部或侧面，生活元素框架场景，清洁视觉层级配装饰花纹',
      elements: ['产品在真实使用配准确比例和保留定制', '人物自然互动产品展示真实尺寸', '优雅排版元素', '柔和装饰花纹', '高端背景纹理', '艺术构图', '专业电商风格', '真实生活氛围', '清晰尺寸参照', '完美保持现有定制设计'],
      text_content: { headline: '专属你的', subheadline: '讲述你故事的作品' }
    },
  };

  return blueprints[type] || blueprints.hero;
}

/**
 * 生成最终的图片提示词
 * 将蓝图、产品分析、设计圣经等信息整合成完整的提示词
 * 
 * @param blueprint - 图片蓝图对象
 * @param analysis - 产品分析结果
 * @param designBible - 设计圣经（配色、风格等）
 * @param preferences - 用户偏好设置
 * @returns 完整的中文提示词
 */
function generateImagePrompt(
  blueprint: ImageBlueprint,
  analysis: ProductAnalysis,
  designBible: DesignBible,
  preferences: GeneratePromptsRequest['preferences']
): string {
  const palette = designBible.color_palette;
  
  // ===== 构建尺寸信息（如有） =====
  const dimensionLines = analysis.dimensions
    ? [
        '【产品尺寸（关键 - 必须准确展示）】：',
        analysis.dimensions.length ? `- 长：${analysis.dimensions.length}` : '',
        analysis.dimensions.width ? `- 宽：${analysis.dimensions.width}` : '',
        analysis.dimensions.height ? `- 高：${analysis.dimensions.height}` : '',
        analysis.dimensions.diameter ? `- 直径：${analysis.dimensions.diameter}` : '',
        analysis.dimensions.weight ? `- 重量：${analysis.dimensions.weight}` : '',
        analysis.dimensions.custom_size ? `- 尺寸说明：${analysis.dimensions.custom_size}` : '',
        '',
        '【尺寸可视化指南】：',
        '- 60x80英寸毛毯 = 大型披毯，覆盖大部分沙发或床',
        '- 人物手持时应展示毛毯显著下垂，而不是像小毛巾一样',
        '- 毛毯应显得厚重和超尺寸',
        '- 相机应定位展示毛毯相对于人物的完整比例',
        '- 如在家具上展示，应垂挂在边缘展示真实尺寸',
      ].filter(Boolean)
    : [];

  const dimensionsInfo = dimensionLines.join('\n');
  
  // ===== 构建完整提示词 =====
  const basePrompt = `亚马逊商品图摄影。${analysis.product_name}。

【设计圣经（适用于所有图片）】：
- 视觉风格：${designBible.visual_style}
- 配色方案：主色 ${palette.primary}，辅色 ${palette.secondary}，强调色 ${palette.accent}，背景色 ${palette.background}，文字色 ${palette.text}
- 灯光风格：${designBible.lighting_style}
- 相机风格：${designBible.camera_style}
- 字体风格：${designBible.font_style.family}，标题 ${designBible.font_style.headline_weight}，正文 ${designBible.font_style.body_weight}
- 构图风格：${designBible.composition_style}
- 情感基调：${designBible.emotion_style}
${dimensionsInfo}

【第${blueprint.index}张图片 - ${blueprint.type}】：
目标：${blueprint.goal}
场景：${blueprint.scene}
相机：${blueprint.camera}
灯光：${blueprint.lighting}
情感：${blueprint.emotion}
构图：${blueprint.composition}

【文字内容（如适用）】：
主标题："${blueprint.text_content.headline}"
副标题："${blueprint.text_content.subheadline}"

【必要要求】：
- 使用设计圣经中的精确配色
- 使用指定的精确字体风格
- 产品始终是视觉焦点
- 无包装元素、无装饰丝带、无包装材料
- 清洁、专业亚马逊Listing质量
- 与套图中其他图片保持一致
${analysis.dimensions ? '- 展示产品准确比例和尺寸' : ''}
- 关键：保留现有定制——参考图展示产品现有定制设计/图案。必须在生成的图片中完美保持此定制。不要更改、修改或替换产品上显示的现有个性化内容（姓名、照片、文字、艺术作品）。只改变背景、灯光、构图和展示风格，同时保持产品的定制设计与参考图完全相同。`;

  return basePrompt;
}

export async function POST(request: Request) {
  try {
    const body: GeneratePromptsRequest = await request.json();
    const { analysis, designBible, preferences } = body;

    if (!analysis || !designBible) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    // Get primary holiday for text content
    // 注意：用户没选节日时，不要 fallback 到 recommended_holidays（可能含用户不想要的节日如 Christmas）
    const primaryHoliday = preferences.selectedHolidays[0] || 'default';
    const holidayText = getHolidayText(primaryHoliday);

    // Define the 6 image types based on user's framework
    const imageTypes = ['hero', 'customization', 'story', 'gifting', 'features', 'lifestyle'];
    
    const prompts: GeneratedPrompt[] = [];
    const blueprint: ListingBlueprint = { images: [] };

    // Generate blueprint and prompts for each image
    imageTypes.forEach((type, index) => {
      const imageBlueprint = generateImageBlueprint(index + 1, type, analysis, designBible, holidayText, preferences);
      const prompt = generateImagePrompt(imageBlueprint, analysis, designBible, preferences);
      
      blueprint.images.push(imageBlueprint);
      
      prompts.push({
        index: index + 1,
        type: imageBlueprint.type,
        displayPrompt: `${imageBlueprint.type}: ${imageBlueprint.headline} - ${imageBlueprint.subheadline}`,
        prompt,
        purpose: imageBlueprint.goal
      });
    });

    return NextResponse.json({
      success: true,
      prompts,
      blueprint
    });

  } catch (error) {
    console.error('Prompt generation failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: '生成失败，请重试' 
    }, { status: 500 });
  }
}
