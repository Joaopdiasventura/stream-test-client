/// <reference lib="webworker" />
import { io } from 'socket.io-client';
import { CreateBeneficiaryDto } from '../../shared/dtos/beneficiary/create-beneficiary.dto';

declare const API_URL: string;

self.onmessage = async (e) => {
  const file: File = e.data;
  const totalLines = await countFileLines(file);
  const batchSize = Math.min(Math.ceil(totalLines / 1000), 1000);

  let processed = 0;
  let batch: CreateBeneficiaryDto[] = [];

  const socket = io(API_URL, { transports: ['websocket'] });
  await new Promise<void>((r) => socket.on('connect', () => r()));

  const sendBatch = () =>
    new Promise<void>((resolve) => {
      socket.emit('beneficiary:create', batch, (res: number) => {
        processed += res;
        postMessage({
          type: 'progress',
          value: Math.round((processed / totalLines) * 1000) / 10,
        });
        batch = [];
        resolve();
      });
    });

  await file
    .stream()
    .pipeThrough(parseLines())
    .pipeTo(
      new WritableStream<string>({
        async write(line) {
          const [name, age, cpf] = line.split('###');
          batch.push({ name, age: parseInt(age), cpf });
          if (batch.length >= batchSize) await sendBatch();
        },
        async close() {
          await sendBatch();
          socket.disconnect();
          postMessage({ type: 'done' });
          self.close();
        },
      })
    );
};

async function countFileLines(file: File): Promise<number> {
  let count = 0;
  await file
    .stream()
    .pipeThrough(parseLines())
    .pipeTo(
      new WritableStream<string>({
        write() {
          count++;
        },
      })
    );
  return count;
}

function parseLines() {
  let buffer = '';
  const decoder = new TextDecoder();
  return new TransformStream<Uint8Array, string>({
    transform(chunk, controller) {
      buffer += decoder.decode(chunk, { stream: true });
      const parts = buffer.split('\n');
      buffer = parts.pop()!;
      for (const line of parts) if (line.trim()) controller.enqueue(line);
    },
    flush(controller) {
      if (buffer.trim()) controller.enqueue(buffer);
    },
  });
}
