import { Exam, HSKLevel, Question, SectionType } from './types';

export const ADMIN_EMAILS = ['mdtafim77889@gmail.com', 'tafimgood@gmail.com'];

export const HSK_DURATIONS: Record<HSKLevel, number> = {
  1: 35,
  2: 45,
  3: 60,
  4: 75,
  5: 90,
  6: 120,
};

export const HSK_SECTION_DURATIONS: Record<HSKLevel, Record<SectionType, number>> = {
  1: { Listening: 15, Reading: 10, Writing: 0 },
  2: { Listening: 20, Reading: 15, Writing: 0 },
  3: { Listening: 25, Reading: 20, Writing: 15 },
  4: { Listening: 30, Reading: 35, Writing: 25 },
  5: { Listening: 30, Reading: 35, Writing: 40 },
  6: { Listening: 35, Reading: 45, Writing: 40 },
};

export const HSK_PASS_THRESHOLDS: Record<HSKLevel, number> = {
  1: 120,
  2: 120,
  3: 180,
  4: 180,
  5: 180,
  6: 180,
};

export const HSK_TOTAL_MARKS: Record<HSKLevel, number> = {
  1: 200,
  2: 200,
  3: 300,
  4: 300,
  5: 300,
  6: 300,
};

const createMockQuestions = (level: HSKLevel, testIndex: number): Question[] => {
  const questions: Question[] = [];
  
  const counts = {
    1: { Listening: 20, Reading: 20, Writing: 0 },
    2: { Listening: 25, Reading: 25, Writing: 0 },
    3: { Listening: 35, Reading: 30, Writing: 10 },
    4: { Listening: 45, Reading: 40, Writing: 15 },
    5: { Listening: 45, Reading: 45, Writing: 20 },
    6: { Listening: 50, Reading: 50, Writing: 1 },
  }[level];

  // Listening
  for (let i = 1; i <= counts.Listening; i++) {
    const isImageQuestion = level <= 3 && i <= 10;
    let text = `Listen to the audio and choose the correct answer for Question ${i}.`;
    let audioScript = `这是 HSK ${level} 级听力考试第 ${i} 题。请听对话并选择正确答案。`;
    let options = ['A. 苹果', 'B. 香蕉', 'C. 西瓜', 'D. 葡萄'];
    let correctAnswer = 'A. 苹果';
    let optionImages: string[] | undefined = undefined;

    if (isImageQuestion) {
      text = `Listen to the audio and choose the correct picture (A, B, or C).`;
      options = ['A', 'B', 'C'];
      correctAnswer = 'B';
      optionImages = [
        `https://picsum.photos/seed/hsk${level}${testIndex}${i}a/400/300`,
        `https://picsum.photos/seed/hsk${level}${testIndex}${i}b/400/300`,
        `https://picsum.photos/seed/hsk${level}${testIndex}${i}c/400/300`
      ];
      // Specific scripts for lower levels
      if (level === 1) audioScript = "你好！很高兴认识你。";
      if (level === 2) audioScript = "你今天想吃什么？我想吃面条。";
      if (level === 3) audioScript = "经理，这份文件我已经准备好了，请您过目。";
      
      // Add a placeholder real audio URL for the first question of each level to demonstrate
      if (i === 1) {
        // Using a public sample mp3 for demonstration
        // In a real app, these would be direct links to HSK audio files
        // q.audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
      }
    }

    questions.push({
      id: `l-${level}-${testIndex}-${i}`,
      type: 'Listening',
      section: 'Listening',
      text,
      audioScript,
      options,
      optionImages,
      correctAnswer,
      maxMarks: level <= 2 ? 5 : 2,
      audioUrl: undefined,
    });
  }

  // Reading
  for (let i = 1; i <= counts.Reading; i++) {
    const isImageQuestion = level <= 3 && i <= 10;
    let text = `Read the following passage and answer Question ${i}.`;
    let imageUrl: string | undefined = undefined;
    let options = ['A. 公园', 'B. 学校', 'C. 医院', 'D. 商店'];
    let correctAnswer = 'A. 公园';

    if (isImageQuestion) {
      text = `Look at the picture and choose the correct description.`;
      imageUrl = `https://picsum.photos/seed/hskr${level}${testIndex}${i}/800/400`;
      options = ['A. 他在看书', 'B. 她在跑步', 'C. 他们在喝咖啡', 'D. 我在睡觉'];
      correctAnswer = 'B. 她在跑步';
    }

    questions.push({
      id: `r-${level}-${testIndex}-${i}`,
      type: 'MCQ',
      section: 'Reading',
      text,
      imageUrl,
      options,
      correctAnswer,
      maxMarks: level <= 2 ? 5 : 2,
    });
  }

  // Writing
  if (counts.Writing > 0) {
    for (let i = 1; i <= counts.Writing; i++) {
      const isAI = (level >= 4 && i > counts.Writing - 5) || (level === 6);
      questions.push({
        id: `w-${level}-${testIndex}-${i}`,
        type: 'Writing',
        section: 'Writing',
        text: level === 6 ? '请写一篇 400 字左右的缩写。' : `HSK ${level} Writing Task ${i}.`,
        modelAnswer: '这是一个标准答案示例。',
        maxMarks: level === 6 ? 100 : (level >= 4 ? 10 : 5),
      });
    }
  }

  return questions;
};

export const MOCK_HSK_EXAMS: Exam[] = [];
