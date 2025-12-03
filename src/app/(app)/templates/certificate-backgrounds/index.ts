// Dynamically import all possible certificate images
const imageModules = import.meta.glob('./brandsoft-cert*.{png,jpg,jpeg,svg,webp}', { eager: true, as: 'url' });

const certificateImages: { name: string; src: string }[] = Object.entries(imageModules).map(([path, src]) => {
  const fileName = path.replace('./', '');
  return {
    name: fileName,
    src: src,
  };
});

export default certificateImages;
