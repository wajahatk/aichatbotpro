import type { SessionStore } from "@typebot.io/runtime-session-store";
import type ivm from "isolated-vm";
import { parseGuessedValueType } from "./parseGuessedValueType";
import type { Variable } from "./schemas";

// Lazy-load isolated-vm so a missing native build doesn't crash the entire
// ORPC route handler at module evaluation time.
const getIvm = (): typeof ivm => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("isolated-vm") as typeof ivm;
};

export const createInlineSyncCodeRunner = ({
  variables,
  sessionStore,
}: {
  variables: Variable[];
  sessionStore: SessionStore;
}) => {
  const isolate = sessionStore.getOrCreateIsolate();
  return (code: string) => {
    const context = isolate.createContextSync();
    try {
      const jail = context.global;
      jail.setSync("global", jail.derefInto());
      variables.forEach((v) => {
        jail.setSync(
          v.id,
          parseTransferrableValue(parseGuessedValueType(v.value)),
        );
      });
      return context.evalClosureSync(
        `return (function() {
      return new Function($0)();
    }())`,
        [code],
        { result: { copy: true }, timeout: 10000 },
      );
    } finally {
      context.release();
    }
  };
};

export const createHttpReqResponseMappingRunner = ({
  response,
  sessionStore,
}: {
  response: unknown;
  sessionStore: SessionStore;
}) => {
  if (
    response === null ||
    typeof response !== "object" ||
    Array.isArray(response)
  )
    return;
  const isolate = sessionStore.getOrCreateIsolate();
  return (expression: string) => {
    const context = isolate.createContextSync();
    try {
      const jail = context.global;
      jail.setSync("global", jail.derefInto());
      const responseCopy = new (getIvm().ExternalCopy)(response);
      try {
        jail.setSync("response", responseCopy.copyInto());
      } finally {
        responseCopy.release();
      }
      return context.evalClosureSync(
        `globalThis.evaluateExpression = function(expression) {
          try {
            // Use Function to safely evaluate the expression
            const func = new Function('statusCode', 'data', 'return (' + expression + ')');
            return func(response.statusCode, response.data);
          } catch (err) {
            throw new Error('Invalid expression: ' + err.message);
          }
        };
        return evaluateExpression.apply(null, arguments);`,
        [expression],
        {
          result: { copy: true },
          timeout: 10000,
        },
      );
    } finally {
      context.release();
    }
  };
};

export const parseTransferrableValue = (value: unknown) => {
  if (typeof value === "object") {
    const copy = new (getIvm().ExternalCopy)(value);
    try {
      return copy.copyInto();
    } finally {
      copy.release();
    }
  }
  return value;
};
