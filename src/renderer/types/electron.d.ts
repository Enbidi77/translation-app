import { electronAPI } from '../../preload';

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
    electron: {
      logger: typeof electronAPI.logger;
    };
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}
