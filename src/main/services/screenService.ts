import { desktopCapturer, screen } from 'electron';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class ScreenService {
  /**
   * Capture the full screen as a NativeImage
   */
  public static async captureFullScreen(): Promise<Electron.NativeImage> {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const scaleFactor = primaryDisplay.scaleFactor || 1;

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.round(width * scaleFactor),
        height: Math.round(height * scaleFactor),
      },
    });

    if (!sources.length) {
      throw new Error('Không thể chụp ảnh màn hình: Không tìm thấy nguồn hiển thị');
    }

    return sources[0].thumbnail;
  }

  /**
   * Crop a captured image to the specified rectangle
   */
  public static async captureRect(rect: CropRect): Promise<string> {
    const fullImage = await this.captureFullScreen();
    const primaryDisplay = screen.getPrimaryDisplay();
    const scaleFactor = primaryDisplay.scaleFactor || 1;

    const scaledRect = {
      x: Math.max(0, Math.round(rect.x * scaleFactor)),
      y: Math.max(0, Math.round(rect.y * scaleFactor)),
      width: Math.max(10, Math.round(rect.width * scaleFactor)),
      height: Math.max(10, Math.round(rect.height * scaleFactor)),
    };

    const cropped = fullImage.crop(scaledRect);
    return cropped.toDataURL();
  }
}
