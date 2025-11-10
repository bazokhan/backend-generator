import { execSync } from 'child_process';
import { formatGeneratedFiles } from '../io/utils/format-files';

jest.mock('child_process');

describe('formatGeneratedFiles', () => {
  it('should return early when filePaths is empty', () => {
    const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
    mockExecSync.mockReturnValue(Buffer.from(''));

    formatGeneratedFiles([], '/base');

    expect(mockExecSync).not.toHaveBeenCalled();
  });

  it('should format files when filePaths provided', () => {
    const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
    mockExecSync.mockReturnValue(Buffer.from(''));

    formatGeneratedFiles(['file1.ts', 'file2.ts'], '/base');

    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('prettier'),
      expect.objectContaining({
        stdio: 'pipe',
        cwd: '/base',
      }),
    );
  });
});
