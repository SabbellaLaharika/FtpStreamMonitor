import { FileSnapshot, SnapshotDiff, FtpFile } from '../types/ftp';

/**
 * Compares two snapshots of a directory and returns the differences.
 */
export function diffSnapshots(previous: FileSnapshot, current: FileSnapshot): SnapshotDiff {
  const diff: SnapshotDiff = {
    added: [],
    modified: [],
    deleted: []
  };

  const prevMap = new Map<string, FtpFile>();
  previous.forEach(file => prevMap.set(file.path, file));

  const currMap = new Map<string, FtpFile>();
  current.forEach(file => currMap.set(file.path, file));

  // Check for added and modified
  current.forEach(currFile => {
    const prevFile = prevMap.get(currFile.path);
    if (!prevFile) {
      diff.added.push(currFile);
    } else if (
      prevFile.size !== currFile.size ||
      prevFile.modifiedAt !== currFile.modifiedAt
    ) {
      diff.modified.push(currFile);
    }
  });

  // Check for deleted
  previous.forEach(prevFile => {
    if (!currMap.has(prevFile.path)) {
      diff.deleted.push(prevFile);
    }
  });

  return diff;
}
