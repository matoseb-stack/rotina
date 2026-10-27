/**
 * Prefixo de caminho do deploy. Vazio na Vercel/local; no GitHub Pages vira
 * "/<repositorio>/investimentos". O Next aplica o basePath em <Link>, mas não
 * em fetch() nem em URLs montadas à mão: use withBase() nesses casos.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const withBase = (path: string) => `${BASE_PATH}${path}`;
