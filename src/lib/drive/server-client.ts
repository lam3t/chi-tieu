import { GoogleDriveFileItem } from "@/types/drive";

const DRIVE_API_BASE = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD_BASE = "https://www.googleapis.com/upload/drive/v3";

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = 3,
  delay = 1000
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Handle 429 (Rate Limit) or 5xx (Server Error) with exponential backoff
      if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
        if (attempt < retries) {
          const waitTime = delay * Math.pow(2, attempt);
          console.warn(`[DriveAPI] Hit ${response.status}. Retrying in ${waitTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }
      }

      return response;
    } catch (err) {
      if (attempt < retries) {
        const waitTime = delay * Math.pow(2, attempt);
        console.warn(`[DriveAPI] Network error. Retrying in ${waitTime}ms...`, err);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Failed request to ${url} after ${retries} retries`);
}

export class GoogleDriveServerClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private getHeaders(contentType?: string): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.accessToken}`,
    };
    if (contentType) {
      headers["Content-Type"] = contentType;
    }
    return headers;
  }

  /**
   * List all files in the user's appDataFolder
   */
  async listAppDataFiles(): Promise<GoogleDriveFileItem[]> {
    const url = `${DRIVE_API_BASE}/files?spaces=appDataFolder&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=100`;
    const res = await fetchWithRetry(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Drive list error (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    return (data.files || []) as GoogleDriveFileItem[];
  }

  /**
   * Read file content by file ID
   */
  async getFileContent(fileId: string): Promise<string> {
    const url = `${DRIVE_API_BASE}/files/${fileId}?alt=media`;
    const res = await fetchWithRetry(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Drive read file error (${res.status}): ${errBody}`);
    }

    return await res.text();
  }

  /**
   * Create a new file in appDataFolder using multipart upload
   */
  async createFile(
    filename: string,
    content: string,
    mimeType = "application/json"
  ): Promise<GoogleDriveFileItem> {
    const metadata = {
      name: filename,
      parents: ["appDataFolder"],
      mimeType,
    };

    const boundary = "-------314159265358979323846";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata) +
      delimiter +
      `Content-Type: ${mimeType}\r\n\r\n` +
      content +
      closeDelimiter;

    const url = `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime`;
    const res = await fetchWithRetry(url, {
      method: "POST",
      headers: this.getHeaders(`multipart/related; boundary=${boundary}`),
      body: multipartRequestBody,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Drive create file error (${res.status}): ${errBody}`);
    }

    return await res.json();
  }

  /**
   * Update existing file content
   */
  async updateFile(
    fileId: string,
    content: string,
    mimeType = "application/json"
  ): Promise<GoogleDriveFileItem> {
    const url = `${DRIVE_UPLOAD_BASE}/files/${fileId}?uploadType=media&fields=id,name,mimeType,modifiedTime`;
    const res = await fetchWithRetry(url, {
      method: "PATCH",
      headers: this.getHeaders(mimeType),
      body: content,
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Drive update file error (${res.status}): ${errBody}`);
    }

    return await res.json();
  }

  /**
   * Save (create or update) a file by filename in appDataFolder
   */
  async saveFile(
    filename: string,
    content: string,
    mimeType = "application/json"
  ): Promise<GoogleDriveFileItem> {
    const existingFiles = await this.listAppDataFiles();
    const existing = existingFiles.find((f) => f.name === filename);

    if (existing) {
      return await this.updateFile(existing.id, content, mimeType);
    } else {
      return await this.createFile(filename, content, mimeType);
    }
  }
}
