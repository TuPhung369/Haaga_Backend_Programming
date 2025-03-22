module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      fontFamily: {
        poppinsRegular: ["Poppins Regular", "sans-serif"],
        poppinsBold: ["Poppins Bold", "sans-serif"],
        poppinsItalic: ["Poppins Italic", "sans-serif"],
        poppinsBoldItalic: ["Poppins Bold Italic", "sans-serif"],
        poppinsExtraBold: ["Poppins ExtraBold", "sans-serif"],
        poppinsExtraBoldItalic: ["Poppins ExtraBold Italic", "sans-serif"],
        poppinsLight: ["Poppins Light", "sans-serif"],
        poppinsLightItalic: ["Poppins Light Italic", "sans-serif"],
        poppinsMedium: ["Poppins Medium", "sans-serif"],
        poppinsMediumItalic: ["Poppins Medium Italic", "sans-serif"],
        poppinsSemiBold: ["Poppins SemiBold", "sans-serif"],
        poppinsSemiBoldItalic: ["Poppins SemiBold Italic", "sans-serif"],
        poppinsThin: ["Poppins Thin", "sans-serif"],
        poppinsThinItalic: ["Poppins Thin Italic", "sans-serif"],
        poppinsExtraLight: ["Poppins ExtraLight", "sans-serif"],
        poppinsExtraLightItalic: ["Poppins ExtraLight Italic", "sans-serif"]
      },
      animation: {
        shine: "shine var(--duration) infinite linear"
      },
      keyframes: {
        shine: {
          "0%": {
            "background-position": "0% 0%"
          },
          "50%": {
            "background-position": "100% 100%"
          },
          to: {
            "background-position": "0% 0%"
          }
        }
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: []
};
