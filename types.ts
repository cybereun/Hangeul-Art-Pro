
export interface StyleTemplate {
  id: number;
  category: string;
  name: string;
  englishName: string;
  description: string;
  template: string;
  example: string;
  icon: string;
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  styleName: string;
  createdAt: number;
}
