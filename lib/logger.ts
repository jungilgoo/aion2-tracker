/**
 * 환경에 따른 로깅 유틸리티
 * 프로덕션 환경에서는 console.log를 비활성화합니다.
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  error: (...args: any[]) => {
    // 에러는 프로덕션에서도 기록
    console.error(...args);
  },

  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  }
};
