# Cintela web

Next.js-gränssnittet för Cintela. Gemensamma visuella byggblock finns i
`src/components/ui`; sidor ska återanvända dem i stället för att skapa lokala
varianter.

```powershell
npm install
npm run dev
npm run lint
npm run build
```

Sätt `NEXT_PUBLIC_API_BASE` i `web/.env.local`, normalt
`http://127.0.0.1:8000` lokalt.
