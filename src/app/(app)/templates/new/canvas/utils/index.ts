// ============ FONTS ============
export const GOOGLE_FONTS = [
    'Poppins', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Raleway',
    'Playfair Display', 'Merriweather', 'Nunito', 'Ubuntu', 'Oswald',
    'Source Sans Pro', 'Dancing Script', 'Pacifico', 'Lobster', 'Quicksand',
    'Bebas Neue', 'Abril Fatface', 'Comfortaa', 'Righteous', 'Inter',
    'Work Sans', 'Fira Sans', 'Rubik', 'Karla', 'Manrope', 'DM Sans',
];

export const FONT_WEIGHTS = [
    { value: 300, label: 'Light' },
    { value: 400, label: 'Regular' },
    { value: 500, label: 'Medium' },
    { value: 600, label: 'Semi Bold' },
    { value: 700, label: 'Bold' },
    { value: 800, label: 'Extra Bold' },
];

export const loadGoogleFonts = () => {
    if (typeof window === 'undefined') return;
    if (document.getElementById('google-fonts-link')) return;
    const link = document.createElement('link');
    link.id = 'google-fonts-link';
    link.href = `https://fonts.googleapis.com/css2?family=${GOOGLE_FONTS.map(f => f.replace(/ /g, '+')).join('&family=')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
};

// ============ CURSORS ============
export const getRotationCursor = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 12 12, auto`;
};

export const getResizeCursor = (position: string): string => {
    const cursors: Record<string, string> = {
        'top-left': 'nwse-resize', 'top-right': 'nesw-resize',
        'bottom-left': 'nesw-resize', 'bottom-right': 'nwse-resize',
        'top-center': 'ns-resize', 'bottom-center': 'ns-resize',
        'middle-left': 'ew-resize', 'middle-right': 'ew-resize',
    };
    return cursors[position] || 'default';
};
