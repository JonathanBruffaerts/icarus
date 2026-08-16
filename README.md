# 🧪 Icarus | Compound Research Database

Icarus is a specialized digital repository designed to catalog and analyze performance-enhancing compounds.
It provides researchers with detailed pharmacological data, including anabolic-to-androgenic ratios,
half-life statistics, and physiological biomarker impacts.

## Live Demo

- https://ehb-mct.github.io/web2-course-project-front-end-JonathanBruffaerts/index.html

## Up & Running 🏃‍➡️

1. Clone the repository:

```bash
git clone https://github.com/EHB-MCT/web2-course-project-front-end-JonathanBruffaerts
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the project root and add your backend URL:

```env
VITE_API_URL=https://web2-course-project-back-end-ylzw.onrender.com
```

4. Launch the development server:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

## Sources 🗃️

- **Chart.js (CDN)**: Used in `script.js` to render the dynamic "Biomarker Impact" bar chart, displaying variances in Testosterone, Estrogen, HDL, and LDL.
	- Docs: https://www.chartjs.org/docs/latest/

- **SmilesDrawer (v1.0.10 CDN)**: Used in `script.js` to parse chemical SMILES codes and render molecular structures onto the HTML canvas.
	- Docs: [View SmilesDrawer Documentation](https://github.com/reymond-group/smilesDrawer)

- **Claude (Anthropic AI Assistant)**: Used to debug and fix a scroll-restoration bug and a stuck-state bug in the detail-view close button.
	- Files: `script.js`, `style.css`
	- Share link: https://claude.ai/share/67f2994a-74db-4d0a-8ca2-3a8ed30f2a1d

