/** Charte graphique Solidarité Roquette (§5). */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        marine: '#1B2443',
        teal: '#105363',
        corail: '#E94C47',
        dore: '#FAB826',
        'lave-corail': '#FCEBEA',
        'lave-dore': '#FEF4DC',
        'lave-bleu': '#EDF0F5',
      },
      fontFamily: {
        // Polices auto-hébergées (pas de Google Fonts en runtime, §4).
        titre: ['"DM Sans"', 'system-ui', 'sans-serif'],
        corps: ['system-ui', 'sans-serif'],
      },
      fontSize: {
        // Base 18px — co-regardé à l'écran (RGAA / illectronisme, §5).
        base: ['1.125rem', { lineHeight: '1.6' }],
      },
    },
  },
  plugins: [],
};
