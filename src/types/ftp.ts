export interface FtpFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size: number;
  modifiedAt: string; // ISO 8601
}

export type FileSnapshot = FtpFile[];

export interface SnapshotDiff {
  added: FtpFile[];
  modified: FtpFile[];
  deleted: FtpFile[];
}
