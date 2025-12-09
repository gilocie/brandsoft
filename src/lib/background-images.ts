
'use client';

// This file acts as a manifest for background images.
// To add a new image:
// 1. Place the image file in the 'public/backgrounds' folder.
// 2. Add a new entry to the array below with its public URL path.
import brandsoftBackground1 from '@/app/(app)/templates/backgrounds/background.jpg';


const backgroundImages: { name: string; src: any }[] = [
  { name: 'background', src: brandsoftBackground1 },
];

export default backgroundImages;
