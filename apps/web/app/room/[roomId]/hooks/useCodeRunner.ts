import { useRef, useState } from "react";

export function useCodeRunner() {
  const workerRef = useRef<Worker | null>(null);
  const [output, setOutput] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  function run(code: string) {
    stop();

    setRunning(true);
    setOutput([]);
    setError(null);

    const worker = new Worker(
      new URL("../../../workers/codeRunner.worker.ts", import.meta.url),
      { type: "module" }
    );

    workerRef.current = worker;

    const timeout = setTimeout(() => {
      worker.terminate();
      setRunning(false);
      setError("Execution timed out");
    }, 2000);

    worker.onmessage = (e) => {
      clearTimeout(timeout);
      setRunning(false);

      if (e.data.type === "success") {
        setOutput(e.data.logs);
      } else {
        setError(e.data.error);
      }

      worker.terminate();
    };

    worker.postMessage({ code });
  }

  function stop() {
    workerRef.current?.terminate();
    workerRef.current = null;
    setRunning(false);
  }

  return {
    run,
    stop,
    output,
    error,
    running,
  };
}
