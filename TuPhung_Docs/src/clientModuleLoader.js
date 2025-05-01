// Custom client module loader for ES modules
export async function loadModule(modulePath) {
  try {
    return await import(modulePath);
  } catch (error) {
    console.error(`Failed to load module: ${modulePath}`, error);
    return null;
  }
}