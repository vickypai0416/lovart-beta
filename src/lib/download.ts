export async function downloadImageByUrl(url: string, filename: string) {
  try {
    let blob: Blob;

    if (url.startsWith('data:')) {
      const response = await fetch(url);
      blob = await response.blob();
    } else {
      const response = await fetch(url);
      blob = await response.blob();
    }

    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(objectUrl);
  } catch {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
}

export async function downloadMultipleImages(images: Array<{ url: string; filename: string }>) {
  for (const image of images) {
    await downloadImageByUrl(image.url, image.filename);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
