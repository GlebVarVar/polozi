export type QuestionType = "multipleChoice" | "imageChoice" | "openText";

export interface Category {
  id: string;
  name: string;
  iconName: string;
  orderIndex: number;
}

export interface Answer {
  id: number;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface AnswerInput {
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface Question {
  id: string;
  categoryId: string;
  text: string;
  type: QuestionType;
  imageName: string | null;
  explanation: string | null;
  difficulty: number;
  orderIndex: number;
  correctTextAnswer: string | null;
  answers: Answer[];
}

export interface QuestionInput {
  id: string;
  categoryId: string;
  text: string;
  type: QuestionType;
  imageName?: string | null;
  explanation?: string | null;
  difficulty: number;
  orderIndex: number;
  correctTextAnswer?: string | null;
  answers: AnswerInput[];
}

export interface School {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  priceFrom: number;
  priceTo: number;
  website: string | null;
  googleMapsURL: string | null;
}

export type SchoolInput = School;
