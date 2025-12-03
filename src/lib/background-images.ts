
'use client';

// When you add a new image to the 'src/app/(app)/templates/backgrounds' folder,
// add a new import line here and add the imported variable to the array below.

import cert0 from '@/app/(app)/templates/backgrounds/brandsoft-cert0.jpg';

const backgroundImages: { name: string; src: any }[] = [
  { name: 'brandsoft-cert0', src: cert0 },
  // { name: 'brandsoft-cert1', src: cert1 }, // Example for next image
];

export default backgroundImages;
