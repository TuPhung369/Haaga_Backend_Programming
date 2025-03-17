// Utility để quản lý reCAPTCHA tokens toàn ứng dụng
// Sử dụng trong tất cả các form gửi dữ liệu cần xác thực

let currentRecaptchaToken = '';

// Cập nhật token khi có token mới từ reCAPTCHA
export const updateRecaptchaToken = (token: string) => {
  // console.log('reCAPTCHA token được cập nhật:', token.substring(0, 10) + '...');
  currentRecaptchaToken = token;
};

export const getRecaptchaToken = (): string => {
  return currentRecaptchaToken;
};

export const hasValidRecaptchaToken = (): boolean => {
  return !!currentRecaptchaToken && currentRecaptchaToken.length > 0;
};

export const isDevEnvironment = (): boolean => {
  const isDevelopment = import.meta.env.MODE === 'development';
  const recaptchaSiteKeyV3 = import.meta.env.VITE_RECAPTCHA_SITE_KEY_V3 || '';
  const isTestKey = recaptchaSiteKeyV3 === '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

  return isDevelopment || isTestKey;
};

export const setupRecaptchaTokenHandler = (
  action: string,
  callback?: (token: string) => void
) => {
  return (token: string) => {
    updateRecaptchaToken(token);
    if (callback) {
      callback(token);
    }
  };
};

export const addRecaptchaTokenToData = <T>(data: T): T & { recaptchaToken?: string } => {
  if (isDevEnvironment()) {
    // Trong môi trường development, không cần thêm token hoặc thông báo
    return { ...data, recaptchaToken: currentRecaptchaToken };
  }

  if (!hasValidRecaptchaToken()) {
    console.warn('Không có token reCAPTCHA hợp lệ khi gửi dữ liệu');
  }

  return { ...data, recaptchaToken: currentRecaptchaToken };
}; 