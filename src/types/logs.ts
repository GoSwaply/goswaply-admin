export interface LogSource {
  name: string;
  group: string;
  exists: boolean;
}

export interface LogFilters {
  lines?: number;
  offset?: number;
  search?: string;
  since?: string;
  until?: string;
}

export interface LogTailResult {
  source: string;
  group: string;
  path: string;
  totalLines: number;
  returned: number;
  offset: number;
  bytesRead: number;
  fileSize: number;
  lines: string[];
  warnings: string[];
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  raw: string;
}
