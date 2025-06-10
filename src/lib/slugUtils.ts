// src/lib/slugUtils.ts

// מפה של אותיות עבריות לאנגליות
const hebrewToEnglish: { [key: string]: string } = {
    'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
    'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm',
    'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p', 'ף': 'f',
    'צ': 'ts', 'ץ': 'ts', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't'
  };
  
  export function createSlugFromName(name: string): string {
    return name
      .toLowerCase()
      .trim()
      // החלפת עברית באנגלית
      .split('')
      .map(char => hebrewToEnglish[char] || char)
      .join('')
      // הסרת תווים מיוחדים
      .replace(/[^a-z0-9\s-]/g, '')
      // החלפת רווחים במקפים
      .replace(/\s+/g, '-')
      // הסרת מקפים כפולים
      .replace(/-+/g, '-')
      // הסרת מקפים מההתחלה והסוף
      .replace(/^-+|-+$/g, '');
  }
  
  export async function generateUniqueSlug(baseName: string, currentSlug?: string): Promise<string> {
    let baseSlug = createSlugFromName(baseName);
    
    // אם השם לא יצר slug תקין, השתמש ב"user"
    if (!baseSlug || baseSlug.length < 2) {
      baseSlug = 'user';
    }
    
    // בדיקת זמינות
    let finalSlug = baseSlug;
    let counter = 1;
    let isAvailable = false;
    
    while (!isAvailable) {
      const response = await fetch('/api/check-slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slug: finalSlug,
          currentSlug // לא לבדוק מול עצמו
        })
      });
      
      const { available } = await response.json();
      
      if (available) {
        isAvailable = true;
      } else {
        finalSlug = `${baseSlug}-${counter}`;
        counter++;
      }
    }
    
    return finalSlug;
  }