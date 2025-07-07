/// <reference lib="webworker" />
declare const API_URL: string;

self.onmessage = async (e) => {
  const file: File = e.data;
  const totalLines = await countFileLines(file);
  const batchSize = Math.floor(totalLines / 1000);

  let processed = 0;
  let batch: { name: string; age: number; cpf: string }[] = [];

  const sendBatch = async () => {
    if (!batch.length) return;
    const res = await fetch(`${API_URL}/beneficiary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });
    if (!res.ok) console.error('Erro no batch:', res.status);
    processed += batch.length;
    const pct = Math.round((processed / totalLines) * 1000) / 10;
    postMessage({ type: 'progress', value: pct });
    batch = [];
  };

  await file
    .stream()
    .pipeThrough(parseLines())
    .pipeTo(
      new WritableStream<string>({
        async write(line) {
          const [name, ageStr, cpf] = line.split('###');
          const age = Number(ageStr);
          if (name && cpf && !isNaN(age)) {
            batch.push({ name, age, cpf });
            if (batch.length >= batchSize) {
              await sendBatch();
            }
          }
        },
        close: async () => {
          await sendBatch();
          postMessage({ type: 'done' });
          self.close();
        },
        abort: (err) => console.error('Stream abortado', err),
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
      const lines = buffer.split('\n');
      buffer = lines.pop()!;
      for (const line of lines) {
        if (line.trim()) controller.enqueue(line);
      }
    },
    flush(controller) {
      if (buffer.trim()) controller.enqueue(buffer);
    },
  });
}
