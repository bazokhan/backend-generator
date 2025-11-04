import * as readline from 'readline';
import { promptUser } from './user-prompt';

// Mock readline module
jest.mock('readline', () => ({
  createInterface: jest.fn(),
}));

describe('promptUser', () => {
  let mockRl: {
    question: jest.Mock;
    close: jest.Mock;
  };
  let questionCallback: (answer: string) => void;
  let mockCreateInterface: jest.MockedFunction<typeof readline.createInterface>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRl = {
      question: jest.fn((question: string, callback: (answer: string) => void) => {
        questionCallback = callback;
      }),
      close: jest.fn(),
    };

    mockCreateInterface = readline.createInterface as jest.MockedFunction<typeof readline.createInterface>;
    mockCreateInterface.mockReturnValue(mockRl as any);
  });

  describe('yes responses', () => {
    it('should return true for "yes"', async () => {
      const promise = promptUser('Test question?');
      questionCallback('yes');
      const result = await promise;

      expect(result).toBe(true);
      expect(mockRl.close).toHaveBeenCalled();
    });

    it('should return true for "y"', async () => {
      const promise = promptUser('Test question?');
      questionCallback('y');
      const result = await promise;

      expect(result).toBe(true);
      expect(mockRl.close).toHaveBeenCalled();
    });

    it('should return true for "YES"', async () => {
      const promise = promptUser('Test question?');
      questionCallback('YES');
      const result = await promise;

      expect(result).toBe(true);
      expect(mockRl.close).toHaveBeenCalled();
    });

    it('should return true for "Y"', async () => {
      const promise = promptUser('Test question?');
      questionCallback('Y');
      const result = await promise;

      expect(result).toBe(true);
      expect(mockRl.close).toHaveBeenCalled();
    });

    it('should return true for "yeah"', async () => {
      const promise = promptUser('Test question?');
      questionCallback('yeah');
      const result = await promise;

      expect(result).toBe(true);
    });

    it('should return true for "yep"', async () => {
      const promise = promptUser('Test question?');
      questionCallback('yep');
      const result = await promise;

      expect(result).toBe(true);
    });

    it('should return true for answer with leading spaces', async () => {
      const promise = promptUser('Test question?');
      questionCallback('  yes');
      const result = await promise;

      expect(result).toBe(true);
    });
  });

  describe('no responses', () => {
    it('should return false for "no"', async () => {
      const promise = promptUser('Test question?');
      questionCallback('no');
      const result = await promise;

      expect(result).toBe(false);
      expect(mockRl.close).toHaveBeenCalled();
    });

    it('should return false for "n"', async () => {
      const promise = promptUser('Test question?');
      questionCallback('n');
      const result = await promise;

      expect(result).toBe(false);
    });

    it('should return false for "NO"', async () => {
      const promise = promptUser('Test question?');
      questionCallback('NO');
      const result = await promise;

      expect(result).toBe(false);
    });

    it('should return false for "N"', async () => {
      const promise = promptUser('Test question?');
      questionCallback('N');
      const result = await promise;

      expect(result).toBe(false);
    });

    it('should return false for empty string', async () => {
      const promise = promptUser('Test question?');
      questionCallback('');
      const result = await promise;

      expect(result).toBe(false);
    });

    it('should return false for "maybe"', async () => {
      const promise = promptUser('Test question?');
      questionCallback('maybe');
      const result = await promise;

      expect(result).toBe(false);
    });

    it('should return false for numeric answer', async () => {
      const promise = promptUser('Test question?');
      questionCallback('123');
      const result = await promise;

      expect(result).toBe(false);
    });
  });

  describe('readline interface creation', () => {
    it('should create readline interface with stdin and stdout', () => {
      void promptUser('Test question?');

      expect(mockCreateInterface).toHaveBeenCalledWith({
        input: process.stdin,
        output: process.stdout,
      });
    });

    it('should call question with the provided question text', () => {
      const questionText = 'Do you want to continue? (y/n):';
      void promptUser(questionText);

      expect(mockRl.question).toHaveBeenCalledWith(questionText, expect.any(Function));
    });

    it('should close readline interface after answering', async () => {
      const promise = promptUser('Test question?');
      questionCallback('yes');
      await promise;

      expect(mockRl.close).toHaveBeenCalledTimes(1);
    });

    it('should close readline interface even for no answer', async () => {
      const promise = promptUser('Test question?');
      questionCallback('no');
      await promise;

      expect(mockRl.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in answer', async () => {
      const promise = promptUser('Test question?');
      questionCallback('y@#$%');
      const result = await promise;

      expect(result).toBe(true);
    });

    it('should handle very long answer starting with y', async () => {
      const promise = promptUser('Test question?');
      questionCallback('y'.repeat(1000));
      const result = await promise;

      expect(result).toBe(true);
    });

    it('should handle answer starting with Y followed by non-letter', async () => {
      const promise = promptUser('Test question?');
      questionCallback('Y123');
      const result = await promise;

      expect(result).toBe(true);
    });

    it('should handle unicode characters', async () => {
      const promise = promptUser('Test question?');
      questionCallback('y✅');
      const result = await promise;

      expect(result).toBe(true);
    });

    it('should handle answer starting with whitespace then y', async () => {
      const promise = promptUser('Test question?');
      questionCallback('   y');
      const result = await promise;

      expect(result).toBe(true);
    });

    it('should handle tab characters', async () => {
      const promise = promptUser('Test question?');
      questionCallback('\ty');
      const result = await promise;

      expect(result).toBe(true);
    });

    it('should handle newline characters', async () => {
      const promise = promptUser('Test question?');
      questionCallback('\ny');
      const result = await promise;

      expect(result).toBe(true);
    });
  });

  describe('multiple calls', () => {
    it('should handle multiple sequential prompts', async () => {
      const promise1 = promptUser('First question?');
      questionCallback('yes');
      const result1 = await promise1;

      const promise2 = promptUser('Second question?');
      questionCallback('no');
      const result2 = await promise2;

      expect(result1).toBe(true);
      expect(result2).toBe(false);
      expect(mockCreateInterface).toHaveBeenCalledTimes(2);
    });

    it('should create new interface for each call', () => {
      void promptUser('First question?');
      void promptUser('Second question?');

      expect(mockCreateInterface).toHaveBeenCalledTimes(2);
    });
  });
});
