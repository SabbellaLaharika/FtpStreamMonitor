import * as ftp from "basic-ftp";
import { FtpFile, FileSnapshot } from "../types/ftp";
import { Readable } from "stream";

export class FtpService {
  private client: ftp.Client;
  private config: ftp.AccessOptions;

  constructor() {
    this.client = new ftp.Client();
    this.client.ftp.verbose = false;
    this.config = {
      host: process.env.FTP_HOST || "localhost",
      user: process.env.FTP_USER || "testuser",
      password: process.env.FTP_PASS || "testpass",
      secure: false, // For local test server
    };
  }

  private async connect() {
    if (!this.client || this.client.closed) {
      await this.client.access(this.config);
    }
  }

  async listRecursive(path: string = "/"): Promise<FileSnapshot> {
    await this.connect();
    const list = await this.client.list(path);
    const result: FileSnapshot = [];

    for (const item of list) {
      const fullPath = `${path === "/" ? "" : path}/${item.name}`;
      
      const file: FtpFile = {
        path: fullPath,
        name: item.name,
        type: item.isDirectory ? "directory" : "file",
        size: item.size,
        modifiedAt: item.modifiedAt ? new Date(item.modifiedAt).toISOString() : new Date().toISOString(),
      };
      
      result.push(file);

      if (item.isDirectory) {
        const subList = await this.listRecursive(fullPath);
        result.push(...subList);
      }
    }

    return result;
  }

  async getFilePreview(path: string): Promise<Buffer> {
    await this.connect();
    const stream = new Readable();
    // basic-ftp downloadTo doesn't directly return a buffer easily, 
    // we can use a temporary buffer or a stream converter.
    
    const chunks: any[] = [];
    const writableStream = new (require('stream').Writable)({
      write(chunk: any, encoding: any, callback: any) {
        chunks.push(chunk);
        callback();
      }
    });

    await this.client.downloadTo(writableStream, path);
    return Buffer.concat(chunks);
  }

  async isConnected(): Promise<boolean> {
    try {
      if (this.client.closed) {
        await this.client.access(this.config);
      }
      await this.client.send("NOOP");
      return true;
    } catch (e) {
      return false;
    }
  }

  async close() {
    if (this.client) {
      this.client.close();
    }
  }
}

export const ftpService = new FtpService();
