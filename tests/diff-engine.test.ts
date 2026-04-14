import { diffSnapshots } from '../src/lib/diff-engine';
import { FileSnapshot, FtpFile } from '../src/types/ftp';

describe('diffSnapshots', () => {
  const file1: FtpFile = {
    path: '/file1.txt',
    name: 'file1.txt',
    type: 'file',
    size: 100,
    modifiedAt: '2026-04-14T10:00:00Z'
  };

  const file2: FtpFile = {
    path: '/dir1',
    name: 'dir1',
    type: 'directory',
    size: 0,
    modifiedAt: '2026-04-14T10:00:00Z'
  };

  test('Comparing an empty snapshot to a populated one (initial load)', () => {
    const previous: FileSnapshot = [];
    const current: FileSnapshot = [file1, file2];
    const diff = diffSnapshots(previous, current);

    expect(diff.added).toHaveLength(2);
    expect(diff.added).toContainEqual(file1);
    expect(diff.added).toContainEqual(file2);
    expect(diff.modified).toHaveLength(0);
    expect(diff.deleted).toHaveLength(0);
  });

  test('Comparing identical snapshots (no changes)', () => {
    const previous: FileSnapshot = [file1, file2];
    const current: FileSnapshot = [file1, file2];
    const diff = diffSnapshots(previous, current);

    expect(diff.added).toHaveLength(0);
    expect(diff.modified).toHaveLength(0);
    expect(diff.deleted).toHaveLength(0);
  });

  test('A scenario with only added files', () => {
    const previous: FileSnapshot = [file1];
    const current: FileSnapshot = [file1, file2];
    const diff = diffSnapshots(previous, current);

    expect(diff.added).toHaveLength(1);
    expect(diff.added[0]).toEqual(file2);
    expect(diff.modified).toHaveLength(0);
    expect(diff.deleted).toHaveLength(0);
  });

  test('A scenario with only modified files', () => {
    const modifiedFile1 = { ...file1, size: 200 };
    const previous: FileSnapshot = [file1];
    const current: FileSnapshot = [modifiedFile1];
    const diff = diffSnapshots(previous, current);

    expect(diff.added).toHaveLength(0);
    expect(diff.modified).toHaveLength(1);
    expect(diff.modified[0]).toEqual(modifiedFile1);
    expect(diff.deleted).toHaveLength(0);
  });

  test('A scenario with only deleted files', () => {
    const previous: FileSnapshot = [file1, file2];
    const current: FileSnapshot = [file1];
    const diff = diffSnapshots(previous, current);

    expect(diff.added).toHaveLength(0);
    expect(diff.modified).toHaveLength(0);
    expect(diff.deleted).toHaveLength(1);
    expect(diff.deleted[0]).toEqual(file2);
  });

  test('A mixed scenario with additions, modifications, and deletions', () => {
    const file3: FtpFile = {
      path: '/file3.txt',
      name: 'file3.txt',
      type: 'file',
      size: 50,
      modifiedAt: '2026-04-14T11:00:00Z'
    };
    const modifiedFile2 = { ...file2, modifiedAt: '2026-04-14T11:30:00Z' };

    const previous: FileSnapshot = [file1, file2];
    const current: FileSnapshot = [modifiedFile2, file3]; // file1 deleted, file2 modified, file3 added
    const diff = diffSnapshots(previous, current);

    expect(diff.added).toHaveLength(1);
    expect(diff.added[0]).toEqual(file3);
    expect(diff.modified).toHaveLength(1);
    expect(diff.modified[0]).toEqual(modifiedFile2);
    expect(diff.deleted).toHaveLength(1);
    expect(diff.deleted[0]).toEqual(file1);
  });
});
