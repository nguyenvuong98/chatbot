export const CV_TOPICS = [
  'personal_info', // 👈 thêm

  'summary',

  // experience
  'experience',
  'responsibility',
  'achievement_exp',

  // project
  'project',
  'project_role',
  'project_tech',
  'project_result',

  // skill
  'skill',
  'technical_skill',
  'soft_skill',

  // education
  'education',

  // others
  'certificate',
  'award',
  'activity',
  'language',

  // meta
  'career_goal',
];

type CvTopic = (typeof CV_TOPICS)[number];

export const TOPIC_KEYWORDS: Record<CvTopic, string[]> = {
  personal_info: [
    'tên',
    'name',
    'phone',
    'sđt',
    'email',
    'liên hệ',
    'tuổi',
    'old',
  ],
  summary: ['giới thiệu', 'tổng quan', 'about you'],
  experience: ['kinh nghiệm', 'experience', 'work history'],
  responsibility: ['trách nhiệm', 'responsibility', 'nhiệm vụ'],
  achievement_exp: ['thành tựu', 'achievement', 'đạt được'],
  project: ['dự án', 'project'],
  project_role: ['vai trò', 'role'],
  project_tech: ['công nghệ', 'tech stack', 'technology'],
  project_result: ['kết quả', 'impact', 'result'],
  skill: ['kỹ năng', 'skill'],
  technical_skill: ['technical', 'backend', 'frontend', 'nestjs', 'node'],
  soft_skill: ['giao tiếp', 'teamwork', 'soft skill'],
  education: ['học vấn', 'education', 'university'],
  certificate: ['chứng chỉ', 'certificate'],
  award: ['giải thưởng', 'award'],
  activity: ['hoạt động', 'activity'],
  language: ['ngoại ngữ', 'language', 'english'],
  career_goal: ['mục tiêu', 'career goal', 'định hướng'],
};

export function classifyQuestion(question: string): CvTopic {
  const q = question.toLowerCase();

  let bestTopic: CvTopic = 'summary';
  let maxScore = 0;

  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    let score = 0;

    for (const k of keywords) {
      if (q.includes(k)) score++;
    }

    if (score > maxScore) {
      maxScore = score;
      bestTopic = topic;
    }
  }

  return bestTopic;
}
