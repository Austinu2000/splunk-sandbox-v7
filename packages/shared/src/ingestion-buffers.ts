import type { RecordedEvent } from './ingestion';
export interface RecordedInputBuffer {
  id: string;
  host: string;
  source: string;
  pending: Omit<RecordedEvent, 'id' | 'bytes'>[];
  byteCredit: number;
  accepted: number;
  delivered: number;
  highWaterBytes: number;
  lastError?: string;
  receipts: { tick: number; events: number; bytes: number; receiver: string }[];
}
export interface IngestionBufferRuntime {
  version: 1;
  nextId: number;
  buffers: RecordedInputBuffer[];
}
