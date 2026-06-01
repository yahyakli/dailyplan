import mongoose from 'mongoose';
import { Badge } from '../src/models/Badge';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

const badges = [
  // --- Planning ---
  {
    _id: 'first_plan',
    name: { en: 'First Step', fr: 'Premier Pas', ar: 'الخطوة الأولى' },
    description: { en: 'Create your very first plan', fr: 'Créez votre tout premier plan', ar: 'أنشئ خطتك الأولى' },
    icon: 'Rocket', tier: 'bronze', category: 'planning', xpReward: 50, condition: { type: 'plan_count', value: 1 }
  },
  {
    _id: 'plan_5',
    name: { en: 'Getting Started', fr: 'Bien Commencé', ar: 'بداية جيدة' },
    description: { en: 'Create 5 plans', fr: 'Créez 5 plans', ar: 'أنشئ 5 خطط' },
    icon: 'Target', tier: 'bronze', category: 'planning', xpReward: 75, condition: { type: 'plan_count', value: 5 }
  },
  {
    _id: 'plan_25',
    name: { en: 'Planner', fr: 'Planificateur', ar: 'مخطط' },
    description: { en: 'Create 25 plans', fr: 'Créez 25 plans', ar: 'أنشئ 25 خطة' },
    icon: 'ClipboardList', tier: 'silver', category: 'planning', xpReward: 150, condition: { type: 'plan_count', value: 25 }
  },
  {
    _id: 'plan_100',
    name: { en: 'Master Planner', fr: 'Maître Planificateur', ar: 'مخطط بارع' },
    description: { en: 'Create 100 plans', fr: 'Créez 100 plans', ar: 'أنشئ 100 خطة' },
    icon: 'Trophy', tier: 'gold', category: 'planning', xpReward: 300, condition: { type: 'plan_count', value: 100 }
  },
  {
    _id: 'plan_365',
    name: { en: 'Planning Legend', fr: 'Légende de la Planification', ar: 'أسطورة التخطيط' },
    description: { en: 'Create 365 plans', fr: 'Créez 365 plans', ar: 'أنشئ 365 خطة' },
    icon: 'Crown', tier: 'platinum', category: 'planning', xpReward: 1000, condition: { type: 'plan_count', value: 365 }
  },
  {
    _id: 'early_bird',
    name: { en: 'Early Bird', fr: 'Lève-tôt', ar: 'عصفور الصباح' },
    description: { en: 'Create 5 plans starting before 07:00', fr: 'Créez 5 plans commençant avant 07h00', ar: 'أنشئ 5 خطط تبدأ قبل 07:00' },
    icon: 'Sunrise', tier: 'bronze', category: 'planning', xpReward: 80, condition: { type: 'early_start', value: 5, time: '07:00' }
  },
  {
    _id: 'night_owl',
    name: { en: 'Night Owl', fr: 'Oiseau de Nuit', ar: 'بومة الليل' },
    description: { en: 'Create 5 plans ending after 22:00', fr: 'Créez 5 plans finissant après 22h00', ar: 'أنشئ 5 خطط تنتهي بعد 22:00' },
    icon: 'Moon', tier: 'bronze', category: 'planning', xpReward: 80, condition: { type: 'late_end', value: 5, time: '22:00' }
  },
  {
    _id: 'deep_worker',
    name: { en: 'Deep Worker', fr: 'Travailleur Profond', ar: 'عامل عميق' },
    description: { en: 'Use Deep Work context 10 times', fr: 'Utilisez le contexte Travail Profond 10 fois', ar: 'استخدم سياق العمل العميق 10 مرات' },
    icon: 'Brain', tier: 'silver', category: 'planning', xpReward: 120, condition: { type: 'context_count', value: 10, context: 'deep_work' }
  },
  {
    _id: 'energy_manager',
    name: { en: 'Energy Manager', fr: 'Gestionnaire d\'Énergie', ar: 'مدير الطاقة' },
    description: { en: 'Use all 7 context tags at least once', fr: 'Utilisez les 7 tags de contexte au moins une fois', ar: 'استخدم جميع وسوم السياق السبعة مرة واحدة على الأقل' },
    icon: 'Zap', tier: 'silver', category: 'planning', xpReward: 200, condition: { type: 'all_contexts_used', value: 1 }
  },
  {
    _id: 'morning_routine',
    name: { en: 'Morning Routine', fr: 'Routine Matinale', ar: 'روتين صباحي' },
    description: { en: 'Create a plan before 08:00 for 14 days', fr: 'Créez un plan avant 08h00 pendant 14 jours', ar: 'أنشئ خطة قبل 08:00 لمدة 14 يوماً' },
    icon: 'Coffee', tier: 'silver', category: 'planning', xpReward: 250, condition: { type: 'early_streak', value: 14, time: '08:00' }
  },

  // --- Streak ---
  {
    _id: 'streak_3',
    name: { en: 'Hat Trick', fr: 'Coup du Chapeau', ar: 'هاتريك' },
    description: { en: 'Maintain a 3-day streak', fr: 'Maintenez une série de 3 jours', ar: 'حافظ على استمرارية لمدة 3 أيام' },
    icon: 'Flame', tier: 'bronze', category: 'streak', xpReward: 60, condition: { type: 'streak', value: 3 }
  },
  {
    _id: 'streak_7',
    name: { en: 'Week Warrior', fr: 'Guerrier de la Semaine', ar: 'محارب الأسبوع' },
    description: { en: 'Maintain a 7-day streak', fr: 'Maintenez une série de 7 jours', ar: 'حافظ على استمرارية لمدة 7 أيام' },
    icon: 'Zap', tier: 'silver', category: 'streak', xpReward: 150, condition: { type: 'streak', value: 7 }
  },
  {
    _id: 'streak_30',
    name: { en: 'Monthly Master', fr: 'Maître du Mois', ar: 'سيد الشهر' },
    description: { en: 'Maintain a 30-day streak', fr: 'Maintenez une série de 30 jours', ar: 'حافظ على استمرارية لمدة 30 يوماً' },
    icon: 'Gem', tier: 'gold', category: 'streak', xpReward: 500, condition: { type: 'streak', value: 30 }
  },
  {
    _id: 'streak_100',
    name: { en: 'Century Club', fr: 'Club du Siècle', ar: 'نادي المئة' },
    description: { en: 'Maintain a 100-day streak', fr: 'Maintenez une série de 100 jours', ar: 'حافظ على استمرارية لمدة 100 يوم' },
    icon: 'Star', tier: 'platinum', category: 'streak', xpReward: 2000, condition: { type: 'streak', value: 100 }
  },
  {
    _id: 'comeback_kid',
    name: { en: 'Comeback Kid', fr: 'Le Revenant', ar: 'طفل العودة' },
    description: { en: 'Resume planning after 7+ day gap', fr: 'Reprenez la planification après une pause de 7+ jours', ar: 'استأنف التخطيط بعد فجوة تزيد عن 7 أيام' },
    icon: 'RotateCcw', tier: 'silver', category: 'streak', xpReward: 150, condition: { type: 'comeback', value: 7 }
  },
  {
    _id: 'grace_used',
    name: { en: 'Second Chance', fr: 'Deuxième Chance', ar: 'فرصة ثانية' },
    description: { en: 'Use the streak grace period', fr: 'Utilisez la période de grâce de série', ar: 'استخدم فترة السماح للاستمرارية' },
    icon: 'HeartPulse', tier: 'bronze', category: 'streak', xpReward: 30, condition: { type: 'grace_used', value: 1 }
  },
  {
    _id: 'plan_month_straight',
    name: { en: 'Full Month', fr: 'Mois Complet', ar: 'شهر كامل' },
    description: { en: 'Plan every day for a calendar month', fr: 'Planifiez chaque jour pendant un mois civil', ar: 'خطط كل يوم لشهر تقويمي كامل' },
    icon: 'CalendarDays', tier: 'gold', category: 'streak', xpReward: 800, condition: { type: 'calendar_month', value: 1 }
  },

  // --- Completion ---
  {
    _id: 'perfect_day',
    name: { en: 'Perfect Day', fr: 'Journée Parfaite', ar: 'يوم مثالي' },
    description: { en: '100% completion on a plan', fr: '100% de complétion sur un plan', ar: 'إكمال الخطة بنسبة 100%' },
    icon: 'CheckCircle2', tier: 'silver', category: 'completion', xpReward: 100, condition: { type: 'perfect_day', value: 1 }
  },
  {
    _id: 'perfect_week',
    name: { en: 'Flawless Week', fr: 'Semaine Sans Faute', ar: 'أسبوع بلا أخطاء' },
    description: { en: '100% completion 7 days in a row', fr: '100% de complétion 7 jours de suite', ar: 'إكمال الخطط بنسبة 100% لـ 7 أيام متتالية' },
    icon: 'Award', tier: 'gold', category: 'completion', xpReward: 600, condition: { type: 'perfect_streak', value: 7 }
  },
  {
    _id: 'xp_1000',
    name: { en: 'XP Hunter', fr: 'Chasseur d\'XP', ar: 'صياد XP' },
    description: { en: 'Earn 1,000 total XP', fr: 'Gagnez 1 000 XP au total', ar: 'اكسب 1,000 XP إجمالاً' },
    icon: 'Coins', tier: 'silver', category: 'completion', xpReward: 100, condition: { type: 'total_xp', value: 1000 }
  },
  {
    _id: 'xp_10000',
    name: { en: 'XP Legend', fr: 'Légende d\'XP', ar: 'أسطورة XP' },
    description: { en: 'Earn 10,000 total XP', fr: 'Gagnez 10 000 XP au total', ar: 'اكسب 10,000 XP إجمالاً' },
    icon: 'Diamond', tier: 'gold', category: 'completion', xpReward: 500, condition: { type: 'total_xp', value: 10000 }
  },
  {
    _id: 'xp_50000',
    name: { en: 'XP Deity', fr: 'Dieu de l\'XP', ar: 'إله XP' },
    description: { en: 'Earn 50,000 total XP', fr: 'Gagnez 50 000 XP au total', ar: 'اكسب 50,000 XP إجمالاً' },
    icon: 'Sparkles', tier: 'platinum', category: 'completion', xpReward: 2500, condition: { type: 'total_xp', value: 50000 }
  },
  {
    _id: 'complete_50_tasks',
    name: { en: 'Task Crusher', fr: 'Écraseur de Tâches', ar: 'محطم المهام' },
    description: { en: 'Complete 50 total tasks', fr: 'Complétez 50 tâches au total', ar: 'أكمل 50 مهمة إجمالاً' },
    icon: 'CheckSquare', tier: 'silver', category: 'completion', xpReward: 200, condition: { type: 'task_count', value: 50 }
  },
  {
    _id: 'complete_500_tasks',
    name: { en: 'Task Machine', fr: 'Machine à Tâches', ar: 'آلة المهام' },
    description: { en: 'Complete 500 total tasks', fr: 'Complétez 500 tâches au total', ar: 'أكمل 500 مهمة إجمالاً' },
    icon: 'Settings', tier: 'gold', category: 'completion', xpReward: 750, condition: { type: 'task_count', value: 500 }
  },
  {
    _id: 'task_1000',
    name: { en: 'Task Titan', fr: 'Titan des Tâches', ar: 'تيتان المهام' },
    description: { en: 'Complete 1,000 total tasks', fr: 'Complétez 1 000 tâches au total', ar: 'أكمل 1,000 مهمة إجمالاً' },
    icon: 'Mountain', tier: 'platinum', category: 'completion', xpReward: 1500, condition: { type: 'task_count', value: 1000 }
  },
  {
    _id: 'critical_completer',
    name: { en: 'No Excuses', fr: 'Pas d\'Excuses', ar: 'لا أعذار' },
    description: { en: 'Complete 10 critical-priority tasks', fr: 'Complétez 10 tâches de priorité critique', ar: 'أكمل 10 مهام ذات أولوية قصوى' },
    icon: 'AlertOctagon', tier: 'gold', category: 'completion', xpReward: 300, condition: { type: 'priority_task_count', value: 10, priority: 'critical' }
  },

  // --- Social ---
  {
    _id: 'top_10',
    name: { en: 'Top 10', fr: 'Top 10', ar: 'أفضل 10' },
    description: { en: 'Reach top 10 on All-Time Leaderboard', fr: 'Atteignez le top 10 du classement général', ar: 'صل إلى أفضل 10 في لوحة الصدارة' },
    icon: 'Medal', tier: 'gold', category: 'social', xpReward: 500, condition: { type: 'rank', value: 10 }
  },
  {
    _id: 'top_1',
    name: { en: 'Champion', fr: 'Champion', ar: 'البطل' },
    description: { en: 'Reach #1 on Leaderboard', fr: 'Atteignez la 1ère place du classement', ar: 'صل إلى المركز الأول في لوحة الصدارة' },
    icon: 'Trophy', tier: 'platinum', category: 'social', xpReward: 2000, condition: { type: 'rank', value: 1 }
  },
  {
    _id: 'invite_friend',
    name: { en: 'Social Planner', fr: 'Planificateur Social', ar: 'مخطط اجتماعي' },
    description: { en: 'Refer 1 user', fr: 'Parrainez 1 utilisateur', ar: 'أحل مستخدماً واحداً' },
    icon: 'Users', tier: 'bronze', category: 'social', xpReward: 100, condition: { type: 'referral_count', value: 1 }
  },
  {
    _id: 'social_butterfly',
    name: { en: 'Social Butterfly', fr: 'Papillon Social', ar: 'فراشة اجتماعية' },
    description: { en: 'Refer 5 users', fr: 'Parrainez 5 utilisateurs', ar: 'أحل 5 مستخدمين' },
    icon: 'Heart', tier: 'silver', category: 'social', xpReward: 500, condition: { type: 'referral_count', value: 5 }
  },

  // --- Special ---
  {
    _id: 'multilingual',
    name: { en: 'World Citizen', fr: 'Citoyen du Monde', ar: 'مواطن عالمي' },
    description: { en: 'Switch language 3 times', fr: 'Changez de langue 3 fois', ar: 'غير اللغة 3 مرات' },
    icon: 'Languages', tier: 'bronze', category: 'special', xpReward: 50, condition: { type: 'lang_switch', value: 3 }
  },
  {
    _id: 'dark_mode_fan',
    name: { en: 'Dark Side', fr: 'Côté Obscur', ar: 'الجانب المظلم' },
    description: { en: 'Use dark mode for 7 consecutive days', fr: 'Utilisez le mode sombre pendant 7 jours consécutifs', ar: 'استخدم الوضع المظلم لـ 7 أيام متتالية' },
    icon: 'Ghost', tier: 'bronze', category: 'special', xpReward: 40, condition: { type: 'dark_mode_streak', value: 7 }
  },
  {
    _id: 'explorer',
    name: { en: 'Explorer', fr: 'Explorateur', ar: 'المستكشف' },
    description: { en: 'Secret: Found an easter egg', fr: 'Secret: Trouvé un œuf de Pâques', ar: 'سر: وجدت بيضة عيد الفصح' },
    icon: 'Compass', tier: 'gold', category: 'special', xpReward: 500, isSecret: true, condition: { type: 'easter_egg', value: 1 }
  },
  {
    _id: 'category_diversity',
    name: { en: 'Jack of All Trades', fr: 'Touche-à-tout', ar: 'صاحب مهارات متعددة' },
    description: { en: 'Complete tasks in all categories in one day', fr: 'Complétez des tâches dans toutes les catégories en une journée', ar: 'أكمل مهام في جميع الفئات في يوم واحد' },
    icon: 'Palette', tier: 'silver', category: 'special', xpReward: 150, condition: { type: 'all_categories_day', value: 1 }
  },
  {
    _id: 'fast_learner',
    name: { en: 'Fast Learner', fr: 'Apprenti Rapide', ar: 'متعلم سريع' },
    description: { en: 'Complete 5 learning tasks', fr: 'Complétez 5 tâches d\'apprentissage', ar: 'أكمل 5 مهام تعلم' },
    icon: 'GraduationCap', tier: 'silver', category: 'special', xpReward: 100, condition: { type: 'category_task_count', value: 5, category: 'learning' }
  },
  {
    _id: 'zen_master',
    name: { en: 'Zen Master', fr: 'Maître Zen', ar: 'سيد زن' },
    description: { en: 'Complete 50 personal or health tasks', fr: 'Complétez 50 tâches personnelles ou de santé', ar: 'أكمل 50 مهمة شخصية أو صحية' },
    icon: 'Flower2', tier: 'gold', category: 'special', xpReward: 400, condition: { type: 'category_task_count_multiple', value: 50, categories: ['personal', 'health'] }
  },
  {
    _id: 'hyper_focused',
    name: { en: 'Hyper Focused', fr: 'Hyper Concentré', ar: 'شديد التركيز' },
    description: { en: 'Complete 10 deep-work tasks in one week', fr: 'Complétez 10 tâches de travail profond en une semaine', ar: 'أكمل 10 مهام عمل عميق في أسبوع واحد' },
    icon: 'Focus', tier: 'silver', category: 'special', xpReward: 200, condition: { type: 'category_task_count_week', value: 10, category: 'work' }
  },
  {
    _id: 'early_riser',
    name: { en: 'Early Riser', fr: 'Lève-tôt Passionné', ar: 'مستيقظ مبكر' },
    description: { en: 'Create plan before 06:00 for 7 days', fr: 'Créez un plan avant 06h00 pendant 7 jours', ar: 'أنشئ خطة قبل 06:00 لمدة 7 أيام' },
    icon: 'Sun', tier: 'gold', category: 'special', xpReward: 400, condition: { type: 'early_streak', value: 7, time: '06:00' }
  },
  {
    _id: 'midnight_oil',
    name: { en: 'Midnight Oil', fr: 'Travailleur de Minuit', ar: 'سهر الليالي' },
    description: { en: 'Complete tasks after midnight 5 times', fr: 'Complétez des tâches après minuit 5 fois', ar: 'أكمل مهام بعد منتصف الليل 5 مرات' },
    icon: 'FlameKindling', tier: 'gold', category: 'special', xpReward: 300, condition: { type: 'late_task_count', value: 5, time: '00:00' }
  },
  {
    _id: 'weekend_warrior',
    name: { en: 'Weekend Warrior', fr: 'Guerrier du Week-end', ar: 'محارب عطلة نهاية الأسبوع' },
    description: { en: 'Plan on 4 consecutive weekends', fr: 'Planifiez pendant 4 week-ends consécutifs', ar: 'خطط في 4 عطلات نهاية أسبوع متتالية' },
    icon: 'CalendarCheck', tier: 'bronze', category: 'special', xpReward: 100, condition: { type: 'weekend_streak', value: 4 }
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected to MongoDB');

    for (const badge of badges) {
      await Badge.findOneAndUpdate(
        { _id: badge._id },
        badge,
        { upsert: true, new: true }
      );
    }

    console.log(`Successfully seeded ${badges.length} badges.`);
    process.exit(0);
  } catch (err) {
    console.error('Error seeding badges:', err);
    process.exit(1);
  }
}

seed();
