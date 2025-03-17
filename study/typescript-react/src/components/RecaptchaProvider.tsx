import React, { ReactNode } from "react";
import ReCaptchaV3 from "./ReCaptchaV3";
import {
  updateRecaptchaToken,
  isDevEnvironment
} from "../utils/recaptchaUtils";

interface RecaptchaProviderProps {
  children: ReactNode;
}

/**
 * RecaptchaProvider component loads reCAPTCHA và cung cấp token cho toàn bộ ứng dụng
 * Đặt component này ở mức cao nhất của ứng dụng (App.tsx) để có token sẵn sàng
 * cho tất cả các chức năng yêu cầu reCAPTCHA
 */
const RecaptchaProvider: React.FC<RecaptchaProviderProps> = ({ children }) => {
  const recaptchaSiteKeyV3 = import.meta.env.VITE_RECAPTCHA_SITE_KEY_V3 || "";

  // Log môi trường trong development để kiểm tra
  if (isDevEnvironment()) {
    console.log("RecaptchaProvider running in development environment");
  }

  return (
    <>
      <ReCaptchaV3
        sitekey={recaptchaSiteKeyV3}
        action="global"
        onVerify={updateRecaptchaToken}
        refreshInterval={120000} // 2 phút, thời gian mặc định
      />
      {children}
    </>
  );
};

export default RecaptchaProvider;
