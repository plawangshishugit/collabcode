/* eslint-disable no-restricted-globals */

self.onmessage = (event) => {
  const { code } = event.data;

  const logs: string[] = [];
  const originalLog = console.log;

  console.log = (...args) => {
    logs.push(args.map(String).join(" "));
  };

  try {
    const result = eval(code);

    if (result !== undefined) {
      logs.push(String(result));
    }

    self.postMessage({
      type: "success",
      logs,
    });
  } catch (err: any) {
    self.postMessage({
      type: "error",
      error: err.message,
    });
  } finally {
    console.log = originalLog;
  }
};
