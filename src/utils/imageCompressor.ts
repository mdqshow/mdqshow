/**
 * Utilidad para comprimir y redimensionar imágenes automáticamente en el navegador
 * antes de guardarlas en el estado o subirlas a Firestore.
 * Esto previene que una imagen de 3MB a 5MB bloquee la cuota de Firestore (máx 1MB por documento)
 * o desborde el localStorage.
 */
export async function compressImage(file: File, maxWidth = 1000, maxHeight = 750, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Error al decodificar la imagen'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Intento 1: WebP o JPEG con calidad estándar
        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL('image/webp', quality);
        } catch {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        // Si excede 500KB (aprox 680,000 chars base64), recomprimimos con calidad más ajustada
        if (dataUrl.length > 680000) {
          try {
            dataUrl = canvas.toDataURL('image/jpeg', 0.65);
          } catch {
            // fallback
          }
        }

        resolve(dataUrl);
      };

      if (typeof readerEvent.target?.result === 'string') {
        img.src = readerEvent.target.result;
      }
    };

    reader.readAsDataURL(file);
  });
}
