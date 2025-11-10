export function camelToSnake(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(camelToSnake);
  }

  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key.replace(/([A-Z])/g, "_$1").toLowerCase(),
        camelToSnake(value),
      ])
    );
  }

  return obj;
}
