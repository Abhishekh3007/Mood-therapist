declare module 'sentiment' {
  export default class Sentiment {
    analyze(input: string): { score: number; comparative: number; tokens: string[]; words: string[] };
  }
}
