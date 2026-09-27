import { electronAPI } from '../../preload';

declare global {
  interface Window {
    electronAPI: typeof electronAPI;
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}
