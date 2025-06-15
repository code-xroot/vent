// src/lib/constants.ts
export const EMOTION_TAGS = [
  { id: 'anxious', label: '🥺 Anxious', color: 'bg-yellow-200 text-yellow-800' },
  { id: 'angry', label: '😡 Angry', color: 'bg-red-200 text-red-800' },
  { id: 'sad', label: '😢 Sad', color: 'bg-blue-200 text-blue-800' },
  { id: 'relieved', label: '😌 Relieved', color: 'bg-green-200 text-green-800' },
  { id: 'happy', label: '😊 Happy', color: 'bg-pink-200 text-pink-800' },
  { id: 'confused', label: '🤔 Confused', color: 'bg-purple-200 text-purple-800' },
  { id: 'stressed', label: '😫 Stressed', color: 'bg-orange-200 text-orange-800' },
];

export const TOPIC_CATEGORIES = [
  { id: 'exams', label: '📚 Exams', color: 'border-indigo-500' },
  { id: 'relationships', label: '💔 Relationships', color: 'border-rose-500' },
  { id: 'mental-health', label: '🧠 Mental Health', color: 'border-teal-500' },
  { id: 'housing', label: '🏡 Housing', color: 'border-amber-500' },
  { id: 'studies', label: '📖 Studies', color: 'border-sky-500' },
  { id: 'social-life', label: '🎉 Social Life', color: 'border-fuchsia-500' },
  { id: 'future', label: '🔮 Future', color: 'border-lime-500' },
  { id: 'other', label: '💬 Other', color: 'border-gray-500' },
];

export const REACTION_TYPES = [
  { id: 'relate', label: '🤝 Relate', emoji: '🤝' },
  { id: 'support', label: '💖 Support', emoji: '💖' },
  { id: 'hug', label: '🤗 Hug', emoji: '🤗' },
  // Add more if desired
];

export const REPORT_REASONS = [
  { id: 'spam', label: 'Spam or Misleading' },
  { id: 'harassment', label: 'Harassment or Hateful Speech' },
  { id: 'violence', label: 'Threats of Violence or Incitement' },
  { id: 'privacy', label: 'Privacy Violation (e.g., sharing personal info)' },
  { id: 'impersonation', label: 'Impersonation' },
  { id: 'self_harm', label: 'Content related to self-harm or suicide (needs urgent review)' },
  { id: 'other', label: 'Other (please specify)' },
];
