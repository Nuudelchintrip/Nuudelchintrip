export interface UploadValidationOptions {
  allowedMimeTypes: readonly string[];
  allowedExtensions: readonly string[];
  maxBytes: number;
  typeError: string;
  sizeError: string;
}

export function validateUploadFile(file: File, options: UploadValidationOptions) {
  const extension = file.name.includes('.')
    ? `.${file.name.split('.').pop()?.toLowerCase()}`
    : '';

  if (
    !options.allowedMimeTypes.includes(file.type.toLowerCase()) ||
    !options.allowedExtensions.includes(extension)
  ) {
    throw new Error(options.typeError);
  }

  if (file.size <= 0 || file.size > options.maxBytes) {
    throw new Error(options.sizeError);
  }
}

export function safeUploadFileName(name: string, fallback: string) {
  const extension = name.includes('.') ? `.${name.split('.').pop()?.toLowerCase()}` : '';
  const base = name
    .slice(0, extension ? -extension.length : undefined)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return `${base || fallback}${extension}`;
}
